# Quantum Frontend

Interfaz web para Quantum, desarrollada con React 19, TypeScript, Vite y Tailwind CSS.

## Descripción y arquitectura

Quantum es una aplicación de gestión de espacios de coworking y reservas. Este repositorio contiene la **interfaz de usuario**: una SPA (Single Page Application) que consume la API REST del backend.

La arquitectura sigue un patrón cliente-servidor clásico:

```
Navegador  →  React (Vite)  →  API REST (Express)  →  MongoDB
```

**Capas del frontend:**

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| Páginas | `src/pages/` | Vistas por ruta (login, dashboard, espacios, reservas, usuarios) |
| Componentes | `src/components/` | UI reutilizable (layout, rutas protegidas, formularios) |
| Contexto | `src/context/` | Estado global de autenticación (JWT) y notificaciones toast |
| Cliente API | `src/lib/api.ts` | Peticiones HTTP centralizadas al backend |
| Tipos | `src/types/` | Contratos TypeScript alineados con la API |

**Roles de usuario:** el operador gestiona reservas y consulta espacios; el administrador además administra usuarios, espacios y analytics. Las rutas sensibles se protegen con `ProtectedRoute` según el rol.

**Despliegue:** en Docker, Vite compila la app a archivos estáticos servidos por nginx. La URL de la API se inyecta en tiempo de build mediante `VITE_API_URL`.

## Requisitos

- Node.js 20+
- Backend de Quantum en ejecución (local o Docker)
- Docker y Docker Compose (opcional)

## Ejecución con Docker

El frontend se levanta junto con el backend y MongoDB desde el repositorio del backend. Ambos repos deben estar en la misma carpeta padre:

```
git/
├── Quantum backend/
└── Quantum frontend/
```

Desde `Quantum backend`:

```bash
docker compose up --build
```

| Servicio | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:3000    |
| Backend  | http://localhost:5000    |
| API      | http://localhost:5000/api|

Para cargar los datos iniciales (usuarios, espacios y reservas de ejemplo):

```bash
cd "../Quantum backend"
npm run docker:seed
```

Credenciales de prueba:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@quantum.com` | `Admin123!` |
| Operador | `operador@quantum.com` | `Operador123!` |

### Variable de entorno en Docker

La URL de la API se configura en **tiempo de build** con `VITE_API_URL`. Por defecto apunta a `http://localhost:5000/api` (accesible desde el navegador del host).

Para cambiarla, crea un `.env` en la carpeta del backend (ver `.env.docker.example`) y reconstruye:

```bash
docker compose up --build
```

---

## Ejecución local (sin Docker)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Contenido de `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Iniciar el backend

En el repositorio del backend, con MongoDB disponible:

```bash
cd "../Quantum backend"
cp .env.example .env
npm install
npm run seed
npm run dev
```

### 4. Iniciar el frontend

```bash
npm run dev
```

| Servicio | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:5000    |

---

## Scripts disponibles

| Script           | Descripción                        |
|------------------|------------------------------------|
| `npm run dev`    | Servidor de desarrollo Vite        |
| `npm run build`  | Compilar para producción           |
| `npm run preview`| Previsualizar build de producción  |
| `npm run lint`   | Ejecutar ESLint                    |

> **Pruebas:** este repositorio no incluye suite de tests automatizados. La validación de calidad se limita a ESLint. Las pruebas de integración y API están en el backend (`npm test` en Quantum backend).

## Documentación de la API

La documentación interactiva (Swagger) la expone el backend:

- **Swagger UI:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **OpenAPI JSON:** [http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)

Endpoints principales consumidos por el frontend:

| Recurso | Rutas |
|---------|-------|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Usuarios | `GET/POST/PUT /api/users`, `PATCH .../activate\|deactivate` |
| Espacios | `GET/POST/PUT /api/spaces` |
| Reservas | `GET/POST /api/reservations`, `PATCH .../cancel`, `GET .../export` |
| Analytics | `GET /api/analytics/reservations` |

Detalle completo de cada endpoint en el [README del backend](../Quantum%20backend/README.md#documentación-api-swagger).

## Estructura del proyecto

```
quantum-frontend/
├── src/
│   ├── components/   # Componentes reutilizables
│   ├── context/      # Auth y Toast
│   ├── lib/          # Cliente API (api.ts)
│   ├── pages/        # Páginas de la aplicación
│   └── types/        # Tipos TypeScript
├── public/
├── Dockerfile        # Build multi-stage (Node + nginx)
├── nginx.conf        # Configuración SPA
└── vite.config.ts
```

## Docker (archivos del frontend)

El `Dockerfile` usa un build multi-stage:

1. **Build:** compila la app con Vite (`npm run build`)
2. **Producción:** sirve `dist/` con nginx en el puerto 80

El contenedor se expone en el puerto **3000** del host (mapeo `3000:80`).

## Limpiar entorno Docker

Desde el repositorio del backend:

```bash
# Detener contenedores
docker compose down

# Detener y borrar datos de MongoDB
docker compose down -v
```

Ver documentación completa en el [README del backend](../Quantum%20backend/README.md).

## Supuestos y decisiones relevantes

- **Repositorios separados:** frontend y backend viven en carpetas hermanas; el `docker-compose.yml` del backend orquesta ambos servicios.
- **Autenticación JWT:** el token se obtiene en login y se envía en cada petición; no hay refresh token ni sesiones del lado del servidor.
- **Roles fijos:** solo existen `admin` y `operator`; la UI oculta o bloquea funcionalidad según el rol devuelto por `/api/auth/me`.
- **URL de API en build:** `VITE_API_URL` se resuelve al compilar (no en runtime). Si cambias la URL en Docker, debes reconstruir la imagen del frontend.
- **Seed en el backend:** usuarios, espacios y reservas de prueba se cargan desde el repositorio del backend, no desde este proyecto.
- **Sin estado global pesado:** se usan React Context para auth y toasts; no se añadió Redux ni similar por la escala del proyecto.

## Limitaciones conocidas y mejoras futuras

**Limitaciones actuales:**

- No hay tests unitarios ni E2E en el frontend; solo linting estático.
- Sin paginación ni búsqueda avanzada en tablas de reservas o usuarios (depende de lo que devuelva la API).
- Sin internacionalización (i18n): la interfaz está en español fijo.
- Sin modo offline ni caché de datos; cada navegación recarga desde la API.
- Manejo de errores básico mediante toasts; no hay reintentos automáticos ni cola de peticiones.

**Mejoras que implementaría con más tiempo:**

- Tests con Vitest + React Testing Library y, en una segunda fase, Playwright para flujos críticos (login, crear/cancelar reserva).
- Paginación, filtros y ordenamiento en listados grandes.
- Refresh token o renovación silenciosa de sesión para evitar cierres abruptos.
- Variables de entorno en runtime (config.js inyectado) para no recompilar al cambiar la URL de la API.
- Pipeline CI/CD (lint, build, tests) y despliegue automatizado.
- Accesibilidad (a11y) auditada y tema oscuro.
