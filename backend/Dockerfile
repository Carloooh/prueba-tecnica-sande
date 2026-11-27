# Etapa 1: Restore y compilacion
FROM mcr.microsoft.com/dotnet/sdk:11.0 AS build
WORKDIR /src

# Copiar .csproj primero para aprovechar el cache de capas en restore
COPY Sande.Api.csproj ./
RUN dotnet restore Sande.Api.csproj

# Copiar codigo fuente y publicar en Release
COPY . .
RUN dotnet publish Sande.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Etapa 2: Runtime ligero
FROM mcr.microsoft.com/dotnet/aspnet:11.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:5095
EXPOSE 5095

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Sande.Api.dll"]
