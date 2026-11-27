using Sande.Api.Models.DTOs;
using Sande.Api.Repositories;

namespace Sande.Api.Services;

public interface IProductoService
{
    Task<List<ProveedorDto>> GetProveedoresAsync(string? q, string? marca = null);
    Task<List<MarcaDto>> GetMarcasAsync(string? q, int? idEntidad);
    Task<ProductosConsultaResponseDto> ConsultarProductosAsync(
        int? idEntidad,
        string? marca,
        int? minClientes,
        List<string>? tipos,
        List<string>? situaciones);
    Task<List<ProductoPrincipalDto>> BuscarProductosPrincipalesAsync(string? q, int? excluirId, string? marca = null, string? categoria = null);
    Task<ResultadoUnificacionDto> UnificarProductosAsync(UnificarRequestDto request);
}

public class ResultadoUnificacionDto
{
    public int TotalProcesados { get; set; }
    public string Mensaje { get; set; } = string.Empty;
}

public class ProductoService : IProductoService
{
    private readonly IProductoRepository _repository;

    public ProductoService(IProductoRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<ProveedorDto>> GetProveedoresAsync(string? q, string? marca = null)
    {
        return await _repository.GetProveedoresAsync(q, marca);
    }

    public async Task<List<MarcaDto>> GetMarcasAsync(string? q, int? idEntidad)
    {
        return await _repository.GetMarcasAsync(q, idEntidad);
    }

    public async Task<ProductosConsultaResponseDto> ConsultarProductosAsync(
        int? idEntidad,
        string? marca,
        int? minClientes,
        List<string>? tipos,
        List<string>? situaciones)
    {
        return await _repository.ConsultarProductosAsync(idEntidad, marca, minClientes, tipos, situaciones);
    }

    public async Task<List<ProductoPrincipalDto>> BuscarProductosPrincipalesAsync(
        string? q, 
        int? excluirId, 
        string? marca = null, 
        string? categoria = null)
    {
        return await _repository.BuscarProductosPrincipalesAsync(q, excluirId, marca, categoria);
    }

    public async Task<ResultadoUnificacionDto> UnificarProductosAsync(UnificarRequestDto request)
    {
        if (request?.Unificaciones == null || !request.Unificaciones.Any())
        {
            throw new ArgumentException("Debe proporcionar al menos un producto para unificar.");
        }

        int procesados = 0;

        foreach (var item in request.Unificaciones)
        {
            if (item.IdProductoOrigen <= 0 || item.IdProductoDestino <= 0)
            {
                throw new ArgumentException("Los identificadores de producto origen y destino deben ser válidos.");
            }

            if (item.IdProductoOrigen == item.IdProductoDestino)
            {
                throw new InvalidOperationException($"No se puede unificar el producto {item.IdProductoOrigen} consigo mismo.");
            }

            // Ejecuta el stored procedure atómico para cada par origen-destino
            await _repository.UnificarProductoAsync(item.IdProductoOrigen, item.IdEntidadOrigen, item.IdProductoDestino);
            procesados++;
        }

        return new ResultadoUnificacionDto
        {
            TotalProcesados = procesados,
            Mensaje = procesados == 1
                ? "Se unificó 1 producto correctamente."
                : $"Se unificaron {procesados} productos correctamente."
        };
    }
}
