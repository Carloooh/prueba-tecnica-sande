using Sande.Api.Models.DTOs;
using Sande.Api.Repositories;

namespace Sande.Api.Services;

public interface IProductoService
{
    Task<List<ProveedorDto>> GetProveedoresAsync(string? q);
    Task<List<MarcaDto>> GetMarcasAsync(string? q, int? idEntidad);
    Task<ProductosConsultaResponseDto> ConsultarProductosAsync(
        int? idEntidad,
        string? marca,
        int? minClientes,
        List<string>? tipos,
        List<string>? situaciones);
    Task<List<ProductoPrincipalDto>> BuscarProductosPrincipalesAsync(string? q, int? excluirId);
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

    public async Task<List<ProveedorDto>> GetProveedoresAsync(string? q)
    {
        return await _repository.GetProveedoresAsync(q);
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

    public async Task<List<ProductoPrincipalDto>> BuscarProductosPrincipalesAsync(string? q, int? excluirId)
    {
        return await _repository.BuscarProductosPrincipalesAsync(q, excluirId);
    }

    public async Task<ResultadoUnificacionDto> UnificarProductosAsync(UnificarRequestDto request)
    {
        if (request == null || request.Unificaciones == null || !request.Unificaciones.Any())
        {
            throw new ArgumentException("No se enviaron filas para unificar.");
        }

        int exitosos = 0;

        foreach (var item in request.Unificaciones)
        {
            // Regla de negocio: impedir auto-agrupación
            if (item.IdProductoOrigen == item.IdProductoDestino)
            {
                throw new InvalidOperationException($"El producto {item.IdProductoOrigen} no puede unificarse consigo mismo.");
            }

            if (item.IdProductoOrigen <= 0 || item.IdProductoDestino <= 0 || item.IdEntidadOrigen <= 0)
            {
                throw new ArgumentException("Los identificadores de producto y proveedor deben ser válidos.");
            }

            // Ejecutar la transacción en BD para cada fila con CODIGO N asignado
            await _repository.UnificarProductoAsync(item.IdProductoOrigen, item.IdEntidadOrigen, item.IdProductoDestino);
            exitosos++;
        }

        return new ResultadoUnificacionDto
        {
            TotalProcesados = exitosos,
            Mensaje = exitosos == 1 
                ? "Se unificó 1 producto con éxito y su stock fue traspasado."
                : $"Se unificaron {exitosos} productos con éxito y sus stocks fueron traspasados."
        };
    }
}
