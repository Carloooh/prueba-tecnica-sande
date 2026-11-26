using Microsoft.AspNetCore.Mvc;
using Sande.Api.Services;

namespace Sande.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MarcasController : ControllerBase
{
    private readonly IProductoService _service;

    public MarcasController(IProductoService service)
    {
        _service = service;
    }

    // GET /api/marcas?q={texto}&idEntidad={idEntidadOpc}
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? q, [FromQuery] int? idEntidad)
    {
        var marcas = await _service.GetMarcasAsync(q, idEntidad);
        return Ok(marcas);
    }
}
