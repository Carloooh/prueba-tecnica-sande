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

    // GET /api/proveedores?q={texto}
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? q)
    {
        var proveedores = await _service.GetProveedoresAsync(q);
        return Ok(proveedores);
    }
}
