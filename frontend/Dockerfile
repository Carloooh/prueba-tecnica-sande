# Etapa 1: Instalacion con pnpm y build de produccion Angular
FROM node:24-slim AS build
WORKDIR /app
ENV CI=true

RUN npm install -g pnpm@10.24.0

# Copiar manifiestos primero para cachear dependencias
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copiar codigo fuente y generar build de produccion
COPY . .
RUN pnpm run build

# Etapa 2: Servidor estatico ligero con Nginx
FROM nginx:alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]
