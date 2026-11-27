using Microsoft.AspNetCore.Mvc;
using Sande.Api.Controllers;
using Sande.Api.Models.DTOs;
using Sande.Api.Services;

namespace Sande.Api.Tests;

public class ControllersTests
{
    private static (
        ProductosController ProductosController,
        MarcasController MarcasController,
        ProveedoresController ProveedoresController,
        FakeProductoRepository Repo) CrearControllers()
    {
        var repo = new FakeProductoRepository();
        var service = new ProductoService(repo);
        return (
            new ProductosController(service),
            new MarcasController(service),
            new ProveedoresController(service),
            repo);
    }

    [Fact]
    public async Task Consulta_ParseaTiposYSituacionesSeparadosPorComa_RetornaOk()
    {
        var (controller, _, _, _) = CrearControllers();

        var actionResult = await controller.Consulta(
            idEntidad: 10,
            marca: "ENERPAC",
            minClientes: 1,
            tipos: "G, P",
            situaciones: "#, A");

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var response = Assert.IsType<ProductosConsultaResponseDto>(okResult.Value);
        Assert.Equal(2, response.Total);
    }

    [Fact]
    public async Task BuscarPrincipales_RetornaOkConCoincidencias()
    {
        var (controller, _, _, _) = CrearControllers();

        var actionResult = await controller.BuscarPrincipales(
            q: "P392",
            excluirId: 102,
            marca: "ENERPAC",
            categoria: "BOMBAS");

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var items = Assert.IsType<List<ProductoPrincipalDto>>(okResult.Value);
        Assert.Single(items);
        Assert.Equal(902, items[0].IdProducto);
    }

    [Fact]
    public async Task Unificar_SolicitudValida_RetornaOk()
    {
        var (controller, _, _, _) = CrearControllers();
        var request = new UnificarRequestDto
        {
            Unificaciones = new List<UnificacionItemDto>
            {
                new() { IdProductoOrigen = 101, IdEntidadOrigen = 10, IdProductoDestino = 901 }
            }
        };

        var actionResult = await controller.Unificar(request);

        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var dto = Assert.IsType<ResultadoUnificacionDto>(okResult.Value);
        Assert.Equal(1, dto.TotalProcesados);
    }

    [Fact]
    public async Task Unificar_AutoUnificacion_RetornaBadRequest()
    {
        var (controller, _, _, _) = CrearControllers();
        var request = new UnificarRequestDto
        {
            Unificaciones = new List<UnificacionItemDto>
            {
                new() { IdProductoOrigen = 101, IdEntidadOrigen = 10, IdProductoDestino = 101 }
            }
        };

        var actionResult = await controller.Unificar(request);

        Assert.IsType<BadRequestObjectResult>(actionResult);
    }

    [Fact]
    public async Task Unificar_ErrorInesperadoDeRepositorio_Retorna500()
    {
        var (controller, _, _, repo) = CrearControllers();
        repo.ExcepcionSimulada = new TimeoutException("Timeout simulado");
        var request = new UnificarRequestDto
        {
            Unificaciones = new List<UnificacionItemDto>
            {
                new() { IdProductoOrigen = 101, IdEntidadOrigen = 10, IdProductoDestino = 901 }
            }
        };

        var actionResult = await controller.Unificar(request);

        var objectResult = Assert.IsType<ObjectResult>(actionResult);
        Assert.Equal(500, objectResult.StatusCode);
    }

    [Fact]
    public async Task ResetDatosPrueba_ExitoYError_RetornaOkO500()
    {
        var (controller, _, _, repo) = CrearControllers();

        var okAction = await controller.ResetDatosPrueba();
        Assert.IsType<OkObjectResult>(okAction);
        Assert.Equal(1, repo.ResetLlamadoCount);

        repo.ExcepcionSimulada = new InvalidOperationException("Fallo simulado");
        var errorAction = await controller.ResetDatosPrueba();
        var errorResult = Assert.IsType<ObjectResult>(errorAction);
        Assert.Equal(500, errorResult.StatusCode);
    }

    [Fact]
    public async Task MarcasYProveedoresControllers_RetornanOkConDatosDePrueba()
    {
        var (_, marcasController, proveedoresController, _) = CrearControllers();

        var marcasResult = await marcasController.Get("MAK", null);
        var marcasOk = Assert.IsType<OkObjectResult>(marcasResult);
        var marcas = Assert.IsType<List<MarcaDto>>(marcasOk.Value);
        Assert.Single(marcas);
        Assert.Equal("MAKITA", marcas[0].Marca);

        var provResult = await proveedoresController.Get("OTERO", "ENERPAC");
        var provOk = Assert.IsType<OkObjectResult>(provResult);
        var proveedores = Assert.IsType<List<ProveedorDto>>(provOk.Value);
        Assert.Single(proveedores);
        Assert.Equal("D-OTERO D", proveedores[0].Abreviacion);
    }
}
