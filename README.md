# Prueba Tecnica SANDE

Proyecto fullstack desarrollado con **.NET 8 Web API** y **Angular 19+ (Angular Material)** para resolver la prueba tecnica de Unificacion de Productos Duplicados, Prioridad de Proveedores y Traspaso de Stock propuesta por **SANDE S.A.**

---

## Arquitectura del Backend (4 Capas)

El backend fue disenado siguiendo una arquitectura limpia y desacoplada en 4 capas para asegurar legibilidad, testabilidad y mantenibilidad:

1. **Controllers (Presentacion / API):** Expone los 5 endpoints REST, gestiona codigos de respuesta HTTP y delega la ejecucion a la capa de servicios.
2. **Services (Logica de Negocio):** Centraliza las reglas del negocio, validaciones preventivas (como impedir auto-agrupacion) y orquesta las operaciones masivas.
3. **Repositories (Acceso a Datos):** Ejecuta consultas SQL optimizadas contra las vistas de SANDE y realiza la invocacion del Stored Procedure de unificacion.
4. **Models / DTOs (Contratos de Datos):** Define las estructuras de transferencia de datos tipadas entre las capas y el cliente frontend.

---

## Entregables y Funcionalidades Implementadas

### 1. APIs REST en Backend (.NET)

- `GET /api/proveedores?q={texto}`: Buscador de proveedores secundarios filtrando por tipo y secuencia.
- `GET /api/marcas?q={texto}&idEntidad={id}`: Buscador de marcas acotadas por proveedor seleccionado.
- `GET /api/productos/consulta?...`: Consulta dinamica sobre la vista maestro aplicando filtros combinados (Lupa).
- `GET /api/productos/principales/buscar?q={texto}&excluirId={id}`: Buscador con autocompletado para asignar `CODIGO N`.
- `POST /api/productos/unificar`: Procesamiento transaccional atómico de unificaciones y traspaso de stock.

### 2. Interfaz Web en Frontend (Angular + Angular Material)

- Barra superior con selectores autocompletables para Marca y Proveedor en cascada.
- Filtros combinados de minimo de clientes (`#C`), tipo de producto (`G, P, R, S`) y situacion (`#, A, C, D, I`).
- Boton Lupa para ejecucion de consulta con totalizador de registros encontrados.
- Grilla con indicadores de clasificacion, estado, clientes, fecha de ultimo ingreso (FUI) y ordenamiento interactivo por columnas (`MatSort`).
- Columna editable con autocomplete y lupa integrada para asignar `CODIGO N` buscando códigos equivalentes por marca y categoría.
- Columna contigua derecha `DESTINO VALIDADO` que despliega el producto principal y proveedor destino verificado.
- Boton Diskette para guardado transaccional y refresco expedito en memoria.
- **Exportación a Excel (.xlsx):** Exporta los registros filtrados en pantalla listos para revisión o modificación masiva.
- **Importación desde Excel (.xlsx):** Carga masiva de códigos modificados desde Excel, autovalidando los destinos y actualizando la grilla antes de guardar.

---

## Instalacion y Puesta en Marcha

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Carloooh/prueba-tecnica-sande.git
cd prueba-tecnica-sande
```

El proyecto se puede levantar de dos formas (ambas exponen los mismos puertos: Frontend en `http://localhost:4200` y Backend/Swagger en `http://localhost:5095`):

---

### Opcion A: Con Docker (recomendada) si es que se encuentra instalado y configurado en el equipo

Requisito: tener **Docker Desktop** (o Docker Engine + Docker Compose) en ejecucion.

1. Crea el archivo `.env` en la raiz del proyecto a partir de `.env.example` y colocar la cadena de conexion en `DB_CONNECTION_STRING`:

```bash
cp .env.example .env
```

2. Construye y levanta ambos servicios:

```bash
docker compose up --build
```

- Aplicacion web: http://localhost:4200
- API Base URL: http://localhost:5095/api
- Swagger UI: http://localhost:5095/swagger
- Para detener los contenedores: `docker compose down` (en segundo plano: `docker compose up -d --build`)

---

### Opcion B: En local sin Docker (en 2 terminales)

#### Requisitos Previos (sin Docker)

- .NET SDK (v8.0 o superior; proyecto compilado con .NET 11)
- Node.js (v18.0 o superior)
- pnpm (gestor de paquetes recomendado para el frontend)

##### Instalar pnpm (solo un comando según la terminal y sistema operativo):

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

#### Terminal 1: Levantar el Backend (.NET Web API)

Ejecuta los siguientes comandos dentro de la carpeta `backend`:

```bash
cd backend

# Restaurar dependencias
dotnet restore

# Configurar la cadena de conexion, se debe completar la dirección del Server, Database, Id de usuario y su Password luego de cada Variable y el signo = en la cadena antes de ejecutar el comando con los datos que ya cuentan ustedes, se ocultan datos sensibles por seguridad y buena práctica
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=,1433;Database=;User Id=;Password=;Encrypt=True;TrustServerCertificate=True;"

# Ejecutar la API
dotnet run
# o con recarga automatica:
dotnet watch run
```

- URL Base del Backend: http://localhost:5095 (o https://localhost:7103)
- API Base URL: http://localhost:5095/api
- Swagger UI: http://localhost:5095/swagger (o https://localhost:7103/swagger)

#### Terminal 2: Levantar el Frontend (Angular)

Ejecuta los siguientes comandos dentro de la carpeta `frontend`:

```bash
cd frontend

# Instalar dependencias
pnpm install

# Levantar la aplicacion
pnpm start
# o
ng serve
```

- Aplicacion web: http://localhost:4200

---

## Procedimientos Almacenados y Base de Datos

Para resolver la unificación creé el procedimiento almacenado `[dbo].[sp_Unificar_Producto]`. La idea principal fue no hacer múltiples consultas sueltas desde el backend ni arriesgarse a dejar datos a medias si algo fallaba entre medio, así que dejé las 4 operaciones obligatorias del negocio encapsuladas dentro de una sola transacción atómica.

En palabras sencillas, lo que hace el procedimiento cuando le mandamos el producto origen (el secundario) y el destino (el principal) es:

1. **Oculta el código duplicado:** Lo registra en `dbo.TFC_Productos_Agrupados_RGB` como hijo del producto principal. Al hacer esto, la vista maestro de Sande lo filtra y desaparece de la grilla de inmediato.
2. **Reordena agrupaciones previas:** Lo guarda en `dbo.TFC_Productos_Agrupados_Finales_RGB` y, en caso de que este código secundario ya tuviera otros códigos agrupados bajo su mando en el pasado, se los reasigna directamente al nuevo producto principal para que no quede ningún registro huérfano.
3. **Ajusta las prioridades del proveedor:** En `dbo.tfc_productos_rgb` busca al proveedor secundario (por ejemplo `D-OTERO D`), le homologa el código para que use el del principal y le cambia de forma automática la prioridad a 2, dejándolo oficialmente como proveedor alternativo del producto principal.
4. **Traspasa todo el stock:** Revisa si el código secundario tiene existencias en cualquiera de las 4 bodegas (`stocke`, `stockt2`, `stockt7`, `stockl3`), se las suma una a una a las bodegas del producto principal (creando el registro si el principal aún no tenía fila de stock) y deja en 0 las existencias del código absorbido.

- **Script:** `backend/Scripts/SP_Unificar_Producto.sql`
- **Procedimiento:** `[dbo].[sp_Unificar_Producto]`
- **Parámetros:** `@id_producto_2` (origen), `@id_entidad_prov_2` (proveedor origen), `@id_producto_1` (destino principal).

> **Reinicio de datos para pruebas:**
> En caso de querer reiniciar los datos de prueba en la base de datos a su estado original, ejecutar en la base de datos:
>
> ```sql
> EXEC [dbo].[sp_Reset_Datos_Prueba];
> ```

---

## Sobre el Desarrollo

Se desarrolló el sistema con backend y frontend separados pero subidos en monorepo a GitHub. Para el backend se utilizó C# con arquitectura limpia de 4 capas y para el frontend se utilizó TypeScript con Angular y Angular Material. Para el desarrollo, me apoyé con documentación oficial de .NET y Angular, e IA para corrección de errores, automatizaciones, mejora en la robustez del código backend principalmente y para testing. En el frontend, me tomé la libertad de darle un estilo propio, pero siguiendo la estructura y componentes que solicitan. Por ejemplo, el buscador de la barra de filtros lo puse para filtrar en caso de que lso filtros no busquen automáticamente por algún fallo, y puse el buscador de código dentro de cada fila para que quede más cómodo de utilizar. Añadí la columna Destino Validado a modo de previsualizar que el código seleccionado sea el que corresponde.

En el backend, por gusto personal, incluí Swagger para probar y documentar los endpoints de la API de forma más visual, amigable y fácil. También dejé configurados archivos de Docker para poder levantar el proyecto de forma más cómoda.

El flujo del proyecto sería:

1.  Interacción con las vistas desde el frontend
2.  Las vistas consumen los endpoints del backend
3.  Backend devuelve la respuesta correspondiente al frontend

4.  El Excel se puede exportar con los filtros correspondientes y al importarlo se ven los datos en la columna Destino Validado para comprobar los cambios antes de guardarlos

En el backend el flujo es:

1. La petición HTTP ingresa al Controller a través del endpoint correspondiente
2. Luego pasa al Service donde se revisa la lógica y se aplican las validaciones necesarias
3. Luego pasa al Repository que se encarga de consultar la base de datos o ejecutar el procedimiento almacenado
4. Finalmente se devuelven los datos formateados en un DTO como respuesta JSON al frontend

---

## Mejoras a Futuro

1. Añadir pruebas unitarias y de integración automatizadas
2. Implementar logs
3. Restricción de acceso a la vista y backend mediante sesión de usuario, permisos y token
4. Listar automáticamente los productos con distinto código y proveedor para listarse y que no tengan que buscarlos en la tabla manualmente para corregirlos
5. Mejoras de interfaz, por ej. que sea más responsiva y con colores no tan planos.
6. En el campo Codigo N, poder buscar por nombre y no solo código para poder filtrar más e identificar más rápido el código correspondiente dentro de la categoría en el buscador.
7. Opción que automáticamente identifique los productos que requieren ser unificados (con IA o algo) y previa autorización humana se hagan los cambios, para no tener que recurrir al excel
