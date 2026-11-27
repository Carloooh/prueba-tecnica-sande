using System.Data;
using Microsoft.Data.SqlClient;
using Sande.Api.Models.DTOs;

namespace Sande.Api.Repositories;

public interface IProductoRepository
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
    Task UnificarProductoAsync(int idProductoOrigen, int idEntidadOrigen, int idProductoDestino);
    Task ResetDatosPruebaAsync();
}

public class ProductoRepository : IProductoRepository
{
    private readonly string _connectionString;

    public ProductoRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Cadena de conexión 'DefaultConnection' no configurada.");
    }

    // Selector de Supplier: consulta proveedores, opcionalmente filtrados por la marca seleccionada
    public async Task<List<ProveedorDto>> GetProveedoresAsync(string? q, string? marca = null)
    {
        var proveedores = new List<ProveedorDto>();

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        string sql;
        if (!string.IsNullOrWhiteSpace(marca))
        {
            // Proveedores que comercializan productos para la marca seleccionada
            sql = @"
                SELECT DISTINCT e.id_entidad, e.Gana_rut, e.abreviacion, e.razon_social
                FROM dbo.tfc_vista_maestro_productos v
                INNER JOIN dbo.entidad e ON v.id_entidad = e.id_entidad
                WHERE v.marca = @marca";
        }
        else
        {
            sql = @"
                SELECT e.id_entidad, e.Gana_rut, e.abreviacion, e.razon_social
                FROM dbo.entidad e
                WHERE e.Tipo = 1 AND (e.gana_secuencia = '001' OR e.gana_secuencia IS NULL)";
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            sql += " AND (e.abreviacion LIKE @q OR e.razon_social LIKE @q OR e.Gana_rut LIKE @q)";
        }

        sql += " ORDER BY e.abreviacion ASC";

        using var command = new SqlCommand(sql, connection);
        if (!string.IsNullOrWhiteSpace(marca))
        {
            command.Parameters.AddWithValue("@marca", marca.Trim());
        }
        if (!string.IsNullOrWhiteSpace(q))
        {
            command.Parameters.AddWithValue("@q", $"%{q.Trim()}%");
        }

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            proveedores.Add(new ProveedorDto
            {
                IdEntidad = reader.GetInt32(0),
                Rut = reader.IsDBNull(1) ? string.Empty : reader.GetString(1).Trim(),
                Abreviacion = reader.IsDBNull(2) ? string.Empty : reader.GetString(2).Trim(),
                RazonSocial = reader.IsDBNull(3) ? string.Empty : reader.GetString(3).Trim()
            });
        }

        return proveedores;
    }

    // Buscador superior de marcas, opcionalmente filtradas por proveedor
    public async Task<List<MarcaDto>> GetMarcasAsync(string? q, int? idEntidad)
    {
        var marcas = new List<MarcaDto>();

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        string sql;

        if (idEntidad.HasValue && idEntidad.Value > 0)
        {
            // Acota a marcas asociadas a los productos del proveedor seleccionado
            sql = @"
                SELECT DISTINCT m.MAR_Codigo, m.MAR_Descripcion
                FROM dbo.marcas m
                INNER JOIN dbo.tfc_vista_maestro_productos v ON m.MAR_Codigo = v.id_marca
                WHERE v.id_entidad = @idEntidad";
        }
        else
        {
            sql = "SELECT MAR_Codigo, MAR_Descripcion FROM dbo.marcas WHERE 1=1";
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            sql += " AND MAR_Descripcion LIKE @q";
        }

        sql += " ORDER BY MAR_Descripcion ASC";

        using var command = new SqlCommand(sql, connection);
        if (idEntidad.HasValue && idEntidad.Value > 0)
        {
            command.Parameters.AddWithValue("@idEntidad", idEntidad.Value);
        }
        if (!string.IsNullOrWhiteSpace(q))
        {
            command.Parameters.AddWithValue("@q", $"%{q.Trim()}%");
        }

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            marcas.Add(new MarcaDto
            {
                IdMarca = reader.GetInt32(0),
                Marca = reader.IsDBNull(1) ? string.Empty : reader.GetString(1).Trim()
            });
        }

        return marcas;
    }

    // Consulta de la grilla (Lupa): filtra sobre tfc_vista_maestro_productos
    public async Task<ProductosConsultaResponseDto> ConsultarProductosAsync(
        int? idEntidad,
        string? marca,
        int? minClientes,
        List<string>? tipos,
        List<string>? situaciones)
    {
        var response = new ProductosConsultaResponseDto();

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var sql = @"
            SELECT 
                id_producto,
                id_entidad,
                seccion,
                categoria,
                codigo_prod,
                code,
                descrip_prod,
                ncli,
                tipo_producto,
                id_situacion,
                fib,
                marca,
                (ISNULL(stocke, 0) + ISNULL(stockt2, 0) + ISNULL(stockt7, 0) + ISNULL(stockl3, 0)) AS stockTotal
            FROM dbo.tfc_vista_maestro_productos
            WHERE 1=1";

        using var command = new SqlCommand();
        command.Connection = connection;

        if (idEntidad.HasValue && idEntidad.Value > 0)
        {
            sql += " AND id_entidad = @idEntidad";
            command.Parameters.AddWithValue("@idEntidad", idEntidad.Value);
        }

        if (!string.IsNullOrWhiteSpace(marca))
        {
            sql += " AND marca = @marca";
            command.Parameters.AddWithValue("@marca", marca.Trim());
        }

        if (minClientes.HasValue && minClientes.Value > 0)
        {
            sql += " AND ncli >= @minClientes";
            command.Parameters.AddWithValue("@minClientes", minClientes.Value);
        }

        // Filtro multicheck tipo_producto (ej. G, P, R, S)
        if (tipos != null && tipos.Any())
        {
            var tipoParams = new List<string>();
            for (int i = 0; i < tipos.Count; i++)
            {
                var paramName = $"@tipo{i}";
                tipoParams.Add(paramName);
                command.Parameters.AddWithValue(paramName, tipos[i].Trim());
            }
            sql += $" AND tipo_producto IN ({string.Join(",", tipoParams)})";
        }

        // Filtro multicheck id_situacion (ej. #, A, C, D, I)
        if (situaciones != null && situaciones.Any())
        {
            var sitParams = new List<string>();
            for (int i = 0; i < situaciones.Count; i++)
            {
                var paramName = $"@sit{i}";
                sitParams.Add(paramName);
                command.Parameters.AddWithValue(paramName, situaciones[i].Trim());
            }
            sql += $" AND id_situacion IN ({string.Join(",", sitParams)})";
        }

        sql += " ORDER BY codigo_prod ASC";
        command.CommandText = sql;

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            response.Items.Add(new ProductoConsultaItemDto
            {
                IdProducto = reader.GetInt32(0),
                IdEntidad = reader.IsDBNull(1) ? 0 : reader.GetInt32(1),
                Seccion = reader.IsDBNull(2) ? string.Empty : reader.GetString(2).Trim(),
                Categoria = reader.IsDBNull(3) ? string.Empty : reader.GetString(3).Trim(),
                Codigo = reader.IsDBNull(4) ? string.Empty : reader.GetString(4).Trim(),
                Code = reader.IsDBNull(5) ? string.Empty : reader.GetString(5).Trim(),
                Producto = reader.IsDBNull(6) ? string.Empty : reader.GetString(6).Trim(),
                NClientes = reader.IsDBNull(7) ? 0 : reader.GetInt32(7),
                Tipo = reader.IsDBNull(8) ? string.Empty : reader.GetString(8).Trim(),
                Situacion = reader.IsDBNull(9) ? string.Empty : reader.GetString(9).Trim(),
                Fui = reader.IsDBNull(10) ? string.Empty : reader.GetString(10).Trim(),
                Marca = reader.IsDBNull(11) ? string.Empty : reader.GetString(11).Trim(),
                StockTotal = reader.IsDBNull(12) ? 0 : Convert.ToDouble(reader.GetValue(12))
            });
        }

        response.Total = response.Items.Count;
        return response;
    }

    // Autocomplete celda CODIGO N: busca productos principales existentes para esa marca y categoría
    public async Task<List<ProductoPrincipalDto>> BuscarProductosPrincipalesAsync(
        string? q, 
        int? excluirId, 
        string? marca = null, 
        string? categoria = null)
    {
        var productos = new List<ProductoPrincipalDto>();

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var sql = @"
            SELECT TOP 30
                id_producto,
                codigo_prod,
                code,
                brand,
                descrip_prod
            FROM dbo.tfc_vista_maestro_productos
            WHERE 1=1";

        using var command = new SqlCommand();
        command.Connection = connection;

        if (excluirId.HasValue && excluirId.Value > 0)
        {
            sql += " AND id_producto <> @excluirId";
            command.Parameters.AddWithValue("@excluirId", excluirId.Value);
        }

        if (!string.IsNullOrWhiteSpace(marca))
        {
            sql += " AND marca = @marca";
            command.Parameters.AddWithValue("@marca", marca.Trim());
        }

        if (!string.IsNullOrWhiteSpace(categoria))
        {
            sql += " AND categoria = @categoria";
            command.Parameters.AddWithValue("@categoria", categoria.Trim());
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            sql += " AND (codigo_prod LIKE @q OR descrip_prod LIKE @q)";
            command.Parameters.AddWithValue("@q", $"%{q.Trim()}%");
        }

        sql += " ORDER BY codigo_prod ASC";
        command.CommandText = sql;

        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            productos.Add(new ProductoPrincipalDto
            {
                IdProducto = reader.GetInt32(0),
                Codigo = reader.IsDBNull(1) ? string.Empty : reader.GetString(1).Trim(),
                Code = reader.IsDBNull(2) ? string.Empty : reader.GetString(2).Trim(),
                Proveedor = reader.IsDBNull(3) ? string.Empty : reader.GetString(3).Trim(),
                Producto = reader.IsDBNull(4) ? string.Empty : reader.GetString(4).Trim()
            });
        }

        return productos;
    }

    // Ejecuta el procedimiento almacenado sp_Unificar_Producto con transacción atómica
    public async Task UnificarProductoAsync(int idProductoOrigen, int idEntidadOrigen, int idProductoDestino)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var command = new SqlCommand("dbo.sp_Unificar_Producto", connection);
        command.CommandType = CommandType.StoredProcedure;

        command.Parameters.AddWithValue("@id_producto_2", idProductoOrigen);
        command.Parameters.AddWithValue("@id_entidad_prov_2", idEntidadOrigen);
        command.Parameters.AddWithValue("@id_producto_1", idProductoDestino);

        await command.ExecuteNonQueryAsync();
    }

    // Ejecuta el procedimiento almacenado sp_Reset_Datos_Prueba para reiniciar los datos de prueba
    public async Task ResetDatosPruebaAsync()
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        using var command = new SqlCommand("dbo.sp_Reset_Datos_Prueba", connection);
        command.CommandType = CommandType.StoredProcedure;

        await command.ExecuteNonQueryAsync();
    }
}
