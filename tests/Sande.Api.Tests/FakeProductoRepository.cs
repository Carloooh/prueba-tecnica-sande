using Sande.Api.Models.DTOs;
using Sande.Api.Repositories;

namespace Sande.Api.Tests;

/// <summary>
/// Repositorio fake en memoria con datos de prueba para ejecutar tests sin tocar la BD real.
/// </summary>
public class FakeProductoRepository : IProductoRepository
{
    public List<ProveedorDto> Proveedores { get; private set; } = new();
    public List<MarcaDto> Marcas { get; private set; } = new();
    public List<ProductoConsultaItemDto> Productos { get; private set; } = new();
    public List<(ProductoPrincipalDto Principal, string Marca, string Categoria)> Principales { get; private set; } = new();

    public List<(int IdOrigen, int IdEntidadOrigen, int IdDestino)> UnificacionesEjecutadas { get; } = new();
    public int ResetLlamadoCount { get; private set; }
    public Exception? ExcepcionSimulada { get; set; }

    public FakeProductoRepository()
    {
        CargarDatosIniciales();
    }

    public void CargarDatosIniciales()
    {
        Proveedores = new List<ProveedorDto>
        {
            new() { IdEntidad = 10, Rut = "76.111.111-1", Abreviacion = "D-OTERO D", RazonSocial = "DISTRIBUIDORA OTERO LTDA" },
            new() { IdEntidad = 20, Rut = "76.222.222-2", Abreviacion = "PROV-B", RazonSocial = "PROVEEDORA B S.A." }
        };

        Marcas = new List<MarcaDto>
        {
            new() { IdMarca = 1, Marca = "ENERPAC" },
            new() { IdMarca = 2, Marca = "MAKITA" }
        };

        Productos = new List<ProductoConsultaItemDto>
        {
            new()
            {
                IdProducto = 101,
                IdEntidad = 10,
                Seccion = "HIDRAULICA",
                Categoria = "CILINDROS",
                Codigo = "RC506-DUP",
                Code = "C101",
                Producto = "CILINDRO HIDRAULICO 50 TON (DUPLICADO)",
                NClientes = 3,
                Tipo = "G",
                Situacion = "A",
                Fui = "2026-01-15",
                Marca = "ENERPAC",
                StockTotal = 5
            },
            new()
            {
                IdProducto = 102,
                IdEntidad = 10,
                Seccion = "HIDRAULICA",
                Categoria = "BOMBAS",
                Codigo = "P392-DUP",
                Code = "C102",
                Producto = "BOMBA MANUAL 2 VELOCIDADES (DUPLICADO)",
                NClientes = 1,
                Tipo = "P",
                Situacion = "#",
                Fui = "2026-02-10",
                Marca = "ENERPAC",
                StockTotal = 2
            },
            new()
            {
                IdProducto = 201,
                IdEntidad = 20,
                Seccion = "HERRAMIENTAS",
                Categoria = "TALADROS",
                Codigo = "MK-800",
                Code = "C201",
                Producto = "TALADRO PERCUTOR",
                NClientes = 8,
                Tipo = "R",
                Situacion = "C",
                Fui = "2026-03-01",
                Marca = "MAKITA",
                StockTotal = 12
            }
        };

        Principales = new List<(ProductoPrincipalDto, string, string)>
        {
            (new ProductoPrincipalDto { IdProducto = 901, Codigo = "RC506", Code = "P901", Proveedor = "ENERPAC USA", Producto = "CILINDRO HIDRAULICO 50 TON" }, "ENERPAC", "CILINDROS"),
            (new ProductoPrincipalDto { IdProducto = 902, Codigo = "P392", Code = "P902", Proveedor = "ENERPAC USA", Producto = "BOMBA MANUAL 2 VELOCIDADES" }, "ENERPAC", "BOMBAS"),
            (new ProductoPrincipalDto { IdProducto = 903, Codigo = "MK-800-P", Code = "P903", Proveedor = "MAKITA CHILE", Producto = "TALADRO PERCUTOR PRINCIPAL" }, "MAKITA", "TALADROS")
        };
    }

    public Task<List<ProveedorDto>> GetProveedoresAsync(string? q, string? marca = null)
    {
        if (ExcepcionSimulada != null) throw ExcepcionSimulada;

        IEnumerable<ProveedorDto> query = Proveedores;
        if (!string.IsNullOrWhiteSpace(marca))
        {
            var entidadesDeMarca = Productos
                .Where(p => p.Marca.Equals(marca.Trim(), StringComparison.OrdinalIgnoreCase))
                .Select(p => p.IdEntidad)
                .ToHashSet();
            query = query.Where(pr => entidadesDeMarca.Contains(pr.IdEntidad));
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(pr =>
                pr.Abreviacion.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                pr.RazonSocial.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                pr.Rut.Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        return Task.FromResult(query.OrderBy(pr => pr.Abreviacion).ToList());
    }

    public Task<List<MarcaDto>> GetMarcasAsync(string? q, int? idEntidad)
    {
        if (ExcepcionSimulada != null) throw ExcepcionSimulada;

        IEnumerable<MarcaDto> query = Marcas;
        if (idEntidad.HasValue && idEntidad.Value > 0)
        {
            var marcasProveedor = Productos
                .Where(p => p.IdEntidad == idEntidad.Value)
                .Select(p => p.Marca)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            query = query.Where(m => marcasProveedor.Contains(m.Marca));
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(m => m.Marca.Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        return Task.FromResult(query.OrderBy(m => m.Marca).ToList());
    }

    public Task<ProductosConsultaResponseDto> ConsultarProductosAsync(
        int? idEntidad,
        string? marca,
        int? minClientes,
        List<string>? tipos,
        List<string>? situaciones)
    {
        if (ExcepcionSimulada != null) throw ExcepcionSimulada;

        IEnumerable<ProductoConsultaItemDto> query = Productos;

        if (idEntidad.HasValue && idEntidad.Value > 0)
            query = query.Where(p => p.IdEntidad == idEntidad.Value);

        if (!string.IsNullOrWhiteSpace(marca))
            query = query.Where(p => p.Marca.Equals(marca.Trim(), StringComparison.OrdinalIgnoreCase));

        if (minClientes.HasValue && minClientes.Value > 0)
            query = query.Where(p => p.NClientes >= minClientes.Value);

        if (tipos != null && tipos.Any())
            query = query.Where(p => tipos.Contains(p.Tipo, StringComparer.OrdinalIgnoreCase));

        if (situaciones != null && situaciones.Any())
            query = query.Where(p => situaciones.Contains(p.Situacion, StringComparer.OrdinalIgnoreCase));

        var items = query.OrderBy(p => p.Codigo).ToList();
        return Task.FromResult(new ProductosConsultaResponseDto
        {
            Total = items.Count,
            Items = items
        });
    }

    public Task<List<ProductoPrincipalDto>> BuscarProductosPrincipalesAsync(
        string? q,
        int? excluirId,
        string? marca = null,
        string? categoria = null)
    {
        if (ExcepcionSimulada != null) throw ExcepcionSimulada;

        var query = Principales.AsEnumerable();

        if (excluirId.HasValue && excluirId.Value > 0)
            query = query.Where(x => x.Principal.IdProducto != excluirId.Value);

        if (!string.IsNullOrWhiteSpace(marca))
            query = query.Where(x => x.Marca.Equals(marca.Trim(), StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(categoria))
            query = query.Where(x => x.Categoria.Equals(categoria.Trim(), StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(x =>
                x.Principal.Codigo.Contains(term, StringComparison.OrdinalIgnoreCase) ||
                x.Principal.Producto.Contains(term, StringComparison.OrdinalIgnoreCase));
        }

        return Task.FromResult(query.Select(x => x.Principal).OrderBy(p => p.Codigo).ToList());
    }

    public Task UnificarProductoAsync(int idProductoOrigen, int idEntidadOrigen, int idProductoDestino)
    {
        if (ExcepcionSimulada != null) throw ExcepcionSimulada;

        UnificacionesEjecutadas.Add((idProductoOrigen, idEntidadOrigen, idProductoDestino));
        Productos.RemoveAll(p => p.IdProducto == idProductoOrigen);
        return Task.CompletedTask;
    }

    public Task ResetDatosPruebaAsync()
    {
        if (ExcepcionSimulada != null) throw ExcepcionSimulada;

        ResetLlamadoCount++;
        UnificacionesEjecutadas.Clear();
        CargarDatosIniciales();
        return Task.CompletedTask;
    }
}
