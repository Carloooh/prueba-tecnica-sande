namespace Sande.Api.Models.DTOs;

// Proveedor secundario a listar (dbo.entidad)
public class ProveedorDto
{
    public int IdEntidad { get; set; }
    public string Rut { get; set; } = string.Empty;
    public string Abreviacion { get; set; } = string.Empty;
    public string RazonSocial { get; set; } = string.Empty;
}

// Filtro superior de marcas (dbo.marcas)
public class MarcaDto
{
    public int IdMarca { get; set; }
    public string Marca { get; set; } = string.Empty;
}

// Fila de la grilla principal obtenida desde tfc_vista_maestro_productos
public class ProductoConsultaItemDto
{
    public int IdProducto { get; set; }
    public int IdEntidad { get; set; }
    public string Seccion { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Producto { get; set; } = string.Empty;
    public int NClientes { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Situacion { get; set; } = string.Empty;
    public string Fui { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public double StockTotal { get; set; }

    // Campos editables en el frontend para asignar la unificación
    public string? CodigoN { get; set; }
    public int? IdProductoDestino { get; set; }
    public string? ProductoDestinoNombre { get; set; }
}

public class ProductosConsultaResponseDto
{
    public int Total { get; set; }
    public List<ProductoConsultaItemDto> Items { get; set; } = new();
}

// Resultado del autocomplete para la celda CODIGO N (productos principales con id_prioridad = 1)
public class ProductoPrincipalDto
{
    public int IdProducto { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Proveedor { get; set; } = string.Empty;
    public string Producto { get; set; } = string.Empty;
}

// Payload para el guardado masivo (acción diskette)
public class UnificacionItemDto
{
    public int IdProductoOrigen { get; set; }
    public int IdEntidadOrigen { get; set; }
    public int IdProductoDestino { get; set; }
}

public class UnificarRequestDto
{
    public List<UnificacionItemDto> Unificaciones { get; set; } = new();
}
