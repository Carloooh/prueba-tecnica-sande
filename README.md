# Prueba Tecnica SANDE

Proyecto construido con .NET Web API y Angular con Angular Material para resolver la prueba tecnica de Unificacion de Productos Duplicados, Prioridad de Proveedores y Traspaso de Stock propuesta por SANDE S.A.

---

## Clonar el Repositorio

```bash
git clone https://github.com/Carloooh/prueba-tecnica-sande.git
cd prueba-tecnica-sande
```

---

## Requisitos Previos

- .NET SDK (v8.0 o superior)
- Node.js (v18.0 o superior)
- pnpm (gestor de paquetes para el frontend)

### Instalar pnpm

Comandos para instalar pnpm segun el sistema operativo:

```bash
# Opcion general (con Node.js y npm instalado):
npm install -g pnpm

# Windows (PowerShell):
iwr https://get.pnpm.io/install.ps1 -useb | iex

# Windows (CMD):
curl -fsSL https://get.pnpm.io/install.cmd | cmd -

# Linux y macOS:
curl -fsSL https://get.pnpm.io/install.sh | sh -

# macOS (Homebrew):
brew install pnpm
```

---

## Procedimientos Almacenados y Base de Datos

Para asegurar una ejecucion atomica y eficiente de las 4 operaciones de unificacion y traspaso de stock, se creo un procedimiento almacenado dedicado:

- **Script:** `backend/Scripts/01_sp_Unificar_Producto.sql`
- **Procedimiento:** `[dbo].[sp_Unificar_Producto]`
- **Parametros:** `@id_producto_2` (origen), `@id_entidad_prov_2` (proveedor origen), `@id_producto_1` (destino principal).

### Pasos ejecutados por el SP dentro de una transaccion atomica:

1. Inserta en `dbo.TFC_Productos_Agrupados_RGB` para ocultar inmediatamente el duplicado de la vista maestro.
2. Inserta/actualiza en `dbo.TFC_Productos_Agrupados_Finales_RGB` y reasigna los productos que tenian al duplicado como madre.
3. Actualiza `dbo.tfc_productos_rgb` reasignando el codigo del principal y cambiando prioridad a 2.
4. Traspasa el stock bodega por bodega (`stocke`, `stockt2`, `stockt7`, `stockl3`) a `dbo.tfc_vista_maestro_productos_stock` y deja en 0 el producto absorbido.

> **Reinicio de datos para pruebas:**
> Si deseas reiniciar los datos de prueba en la base de datos a su estado original, ejecuta:
>
> ```sql
> EXEC [dbo].[sp_Reset_Datos_Prueba];
> ```

---

## Levantar el Backend (.NET Web API)

Ejecuta los siguientes comandos dentro de la carpeta `backend`:

```bash
cd backend

# 1. Restaurar dependencias
dotnet restore

# 2. Configurar la cadena de conexion a la base de datos
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=db82943.public.databaseasp.net,1433;Database=db82943;User Id=db82943;Password=Sande1771;Encrypt=True;TrustServerCertificate=True;"

# 3. Ejecutar la API
dotnet run
# o con recarga automatica:
dotnet watch run
```

- URL Base del Backend: http://localhost:5095 (o https://localhost:7103)
- API Base URL: http://localhost:5095/api
- Swagger UI: http://localhost:5095/swagger (o https://localhost:7103/swagger)

---

## Levantar el Frontend (Angular)

Ejecuta los siguientes comandos dentro de la carpeta `frontend`:

```bash
cd frontend

# 1. Instalar dependencias
pnpm install

# 2. Levantar el proyecto (puedes usar pnpm o ng serve)
pnpm start
# o
ng serve
```

- Aplicacion web: http://localhost:4200

---

## Entregables y Funcionalidades Implementadas

1. **APIs REST en Backend (.NET):**
   - `GET /api/proveedores?q={texto}`: Buscador de proveedores filtrando por tipo y secuencia.
   - `GET /api/marcas?q={texto}&idEntidad={id}`: Buscador de marcas acotadas por proveedor.
   - `GET /api/productos/consulta?...`: Consulta dinamica en vista maestro aplicando filtros combinados (Lupa).
   - `GET /api/productos/principales/buscar?q={texto}&excluirId={id}`: Buscador autocomplete para `CODIGO N`.
   - `POST /api/productos/unificar`: Procesamiento masivo de unificaciones bajo transaccion atomica.

2. **Interfaz Web en Frontend (Angular + Angular Material):**
   - Barra superior con selectores autocompletables para Marca y Proveedor.
   - Filtros combinados de minimo de clientes (`#C`), tipo de producto (`G, P, R, S`) y situacion (`#, A, C, D, I`).
   - Boton Lupa para ejecucion de consulta con totalizador de registros encontrados.
   - Grilla con indicadores de clasificacion, estado, clientes y fecha de ultimo ingreso (FUI).
   - Columna editable con autocomplete para asignar `CODIGO N` y visualizacion del destino validado.
   - Boton Diskette para guardado transaccional y recarga automatica de la grilla.

---

## Extras y Mejoras Añadidas

- **Procedimiento Almacenado Optimizado:** Centralizacion de las 4 operaciones de unificacion con control de errores `TRY...CATCH`, `XACT_ABORT` y `ROLLBACK` automatico.
- **Validacion de Auto-agrupacion:** Bloqueo preventivo en frontend y backend para impedir que un producto se unifique consigo mismo.
- **Feedback Visual Inmediato:** Notificaciones claras al completar unificaciones o ante validaciones pendientes.
- **[Tu funcionalidad extra]:** Espacio para documentar la funcion adicional que desarrolles durante la prueba.

## Comentarios Sobre el Desarrollo

## Mejoras a Futuro

## Uso de IA en el Desarrollo
