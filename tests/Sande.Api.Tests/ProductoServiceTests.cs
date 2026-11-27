using Sande.Api.Models.DTOs;
using Sande.Api.Services;

namespace Sande.Api.Tests;

public class ProductoServiceTests
{
    private static (ProductoService Service, FakeProductoRepository Repo) CrearSut()
    {
        var repo = new FakeProductoRepository();
        var service = new ProductoService(repo);
        return (service, repo);
    }

    [Fact]
    public async Task GetProveedoresAsync_FiltraPorMarcaYTexto_RetornaCoincidencias()
    {
        var (service, _) = CrearSut();

        var resultado = await service.GetProveedoresAsync("OTERO", "ENERPAC");

        var proveedor = Assert.Single(resultado);
        Assert.Equal(10, proveedor.IdEntidad);
        Assert.Equal("D-OTERO D", proveedor.Abreviacion);
    }

    [Fact]
    public async Task GetMarcasAsync_FiltraPorProveedor_RetornaMarcasAsociadas()
    {
        var (service, _) = CrearSut();

        var resultado = await service.GetMarcasAsync(null, idEntidad: 10);

        var marca = Assert.Single(resultado);
        Assert.Equal("ENERPAC", marca.Marca);
    }

    [Fact]
    public async Task ConsultarProductosAsync_AplicaFiltrosCombinados_RetornaRegistrosEsperados()
    {
        var (service, _) = CrearSut();

        var respuesta = await service.ConsultarProductosAsync(
            idEntidad: 10,
            marca: "ENERPAC",
            minClientes: 2,
            tipos: new List<string> { "G" },
            situaciones: new List<string> { "A" });

        Assert.Equal(1, respuesta.Total);
        var item = Assert.Single(respuesta.Items);
        Assert.Equal(101, item.IdProducto);
        Assert.Equal("RC506-DUP", item.Codigo);
    }

    [Fact]
    public async Task BuscarProductosPrincipalesAsync_ExcluyeIdYFiltraPorMarcaYCategoria()
    {
        var (service, _) = CrearSut();

        var resultado = await service.BuscarProductosPrincipalesAsync(
            q: "RC506",
            excluirId: 101,
            marca: "ENERPAC",
            categoria: "CILINDROS");

        var principal = Assert.Single(resultado);
        Assert.Equal(901, principal.IdProducto);
        Assert.Equal("RC506", principal.Codigo);
    }

    [Fact]
    public async Task UnificarProductosAsync_ListaVacia_LanzaArgumentException()
    {
        var (service, repo) = CrearSut();
        var request = new UnificarRequestDto { Unificaciones = new List<UnificacionItemDto>() };

        await Assert.ThrowsAsync<ArgumentException>(() => service.UnificarProductosAsync(request));
        Assert.Empty(repo.UnificacionesEjecutadas);
    }

    [Theory]
    [InlineData(0, 901)]
    [InlineData(-5, 901)]
    [InlineData(101, 0)]
    [InlineData(101, -1)]
    public async Task UnificarProductosAsync_IdsInvalidos_LanzaArgumentException(int origen, int destino)
    {
        var (service, repo) = CrearSut();
        var request = new UnificarRequestDto
        {
            Unificaciones = new List<UnificacionItemDto>
            {
                new() { IdProductoOrigen = origen, IdEntidadOrigen = 10, IdProductoDestino = destino }
            }
        };

        await Assert.ThrowsAsync<ArgumentException>(() => service.UnificarProductosAsync(request));
        Assert.Empty(repo.UnificacionesEjecutadas);
    }

    [Fact]
    public async Task UnificarProductosAsync_MismoProductoOrigenYDestino_LanzaInvalidOperationException()
    {
        var (service, repo) = CrearSut();
        var request = new UnificarRequestDto
        {
            Unificaciones = new List<UnificacionItemDto>
            {
                new() { IdProductoOrigen = 101, IdEntidadOrigen = 10, IdProductoDestino = 101 }
            }
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.UnificarProductosAsync(request));
        Assert.Empty(repo.UnificacionesEjecutadas);
    }

    [Fact]
    public async Task UnificarProductosAsync_UnProductoValido_EjecutaUnificacionYRetornaMensajeSingular()
    {
        var (service, repo) = CrearSut();
        var request = new UnificarRequestDto
        {
            Unificaciones = new List<UnificacionItemDto>
            {
                new() { IdProductoOrigen = 101, IdEntidadOrigen = 10, IdProductoDestino = 901 }
            }
        };

        var resultado = await service.UnificarProductosAsync(request);

        Assert.Equal(1, resultado.TotalProcesados);
        Assert.Equal("Se unificó 1 producto correctamente.", resultado.Mensaje);
        Assert.Single(repo.UnificacionesEjecutadas);
        Assert.DoesNotContain(repo.Productos, p => p.IdProducto == 101);
    }

    [Fact]
    public async Task UnificarProductosAsync_VariosProductos_EjecutaTodosYRetornaMensajePlural()
    {
        var (service, repo) = CrearSut();
        var request = new UnificarRequestDto
        {
            Unificaciones = new List<UnificacionItemDto>
            {
                new() { IdProductoOrigen = 101, IdEntidadOrigen = 10, IdProductoDestino = 901 },
                new() { IdProductoOrigen = 102, IdEntidadOrigen = 10, IdProductoDestino = 902 }
            }
        };

        var resultado = await service.UnificarProductosAsync(request);

        Assert.Equal(2, resultado.TotalProcesados);
        Assert.Equal("Se unificaron 2 productos correctamente.", resultado.Mensaje);
        Assert.Equal(2, repo.UnificacionesEjecutadas.Count);
    }

    [Fact]
    public async Task ResetDatosPruebaAsync_RestauraLosDatosSimuladosEnMemoria()
    {
        var (service, repo) = CrearSut();
        await service.UnificarProductosAsync(new UnificarRequestDto
        {
            Unificaciones = new List<UnificacionItemDto>
            {
                new() { IdProductoOrigen = 101, IdEntidadOrigen = 10, IdProductoDestino = 901 }
            }
        });
        Assert.DoesNotContain(repo.Productos, p => p.IdProducto == 101);

        await service.ResetDatosPruebaAsync();

        Assert.Equal(1, repo.ResetLlamadoCount);
        Assert.Contains(repo.Productos, p => p.IdProducto == 101);
    }
}
