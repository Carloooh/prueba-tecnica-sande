# Prueba Tecnica SANDE

Proyecto construido con .NET Web API y Angular con Angular Material para resolver la prueba tecnica propuesta por SANDE S.A.

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

- Swagger: http://localhost:5000/swagger o https://localhost:7000/swagger

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
