using Microsoft.AspNetCore.Mvc;
using Sande.Api.Services;

namespace Sande.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProveedoresController : ControllerBase
{
    private readonly IProductoService _service;

    public ProveedoresController(IProductoService service)
    {
        _service = service;
    }

    // GET /api/proveedores?q={texto}&marca={marca}
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? q, [FromQuery] string? marca)
    {
        var proveedores = await _service.GetProveedoresAsync(q, marca);
        return Ok(proveedores);
    }
}
