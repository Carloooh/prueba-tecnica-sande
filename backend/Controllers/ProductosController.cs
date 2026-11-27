using Microsoft.AspNetCore.Mvc;
using Sande.Api.Models.DTOs;
using Sande.Api.Services;

namespace Sande.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductosController : ControllerBase
{
    private readonly IProductoService _service;

    public ProductosController(IProductoService service)
    {
        _service = service;
    }

    // GET /api/productos/consulta?idEntidad={id}&marca={m}&minClientes={c}&tipos={G,P,R,S}&situaciones={#,A,C,D,I}
    // Acción Lupa: consulta la vista maestro aplicando los filtros de la barra superior
    [HttpGet("consulta")]
    public async Task<IActionResult> Consulta(
        [FromQuery] int? idEntidad,
        [FromQuery] string? marca,
        [FromQuery] int? minClientes,
        [FromQuery] string? tipos,
        [FromQuery] string? situaciones)
    {
        var tiposList = !string.IsNullOrWhiteSpace(tipos)
            ? tipos.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
            : null;

        var situacionesList = !string.IsNullOrWhiteSpace(situaciones)
            ? situaciones.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList()
            : null;

        var resultado = await _service.ConsultarProductosAsync(idEntidad, marca, minClientes, tiposList, situacionesList);
        return Ok(resultado);
    }

    // GET /api/productos/principales/buscar?q={texto}&excluirId={idProdOrigen}&marca={marca}&categoria={cat}
    // Autocomplete celda CODIGO N: busca productos principales activos (id_prioridad = 1) para esa marca y categoría
    [HttpGet("principales/buscar")]
    public async Task<IActionResult> BuscarPrincipales(
        [FromQuery] string? q, 
        [FromQuery] int? excluirId,
        [FromQuery] string? marca,
        [FromQuery] string? categoria)
    {
        var productos = await _service.BuscarProductosPrincipalesAsync(q, excluirId, marca, categoria);
        return Ok(productos);
    }

    // POST /api/productos/unificar
    // Acción Diskette: guardado masivo bajo transacción SQL atómica
    [HttpPost("unificar")]
    public async Task<IActionResult> Unificar([FromBody] UnificarRequestDto request)
    {
        try
        {
            var resultado = await _service.UnificarProductosAsync(request);
            return Ok(resultado);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error al procesar la unificación.", error = ex.Message });
        }
    }
}
