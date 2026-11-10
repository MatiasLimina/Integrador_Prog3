# 02 — Descripción general

> Vigente para el **Global** (`docs/consignas/Consignas Global.pdf`). El stack del primer parcial (100 % cliente, `localStorage`, sin backend) es antecedente: ver [../CHANGES.md](../CHANGES.md).

## Stack
- **Frontend**: **HTML5** semántico, **CSS3** (Flexbox/Grid, archivos externos) y **JavaScript nativo** (ES modules opcional, sin dependencias) en `frontend/public/`. Prohibido en el frontend: librerías, frameworks, CDNs de CSS/JS, npm, build tools. Recursos (estilos, scripts, imágenes) locales.
- **Servidor web**: Nginx (`nginx:1.30-alpine`, imagen oficial definida en `frontend/Dockerfile`). Sirve `public/` tal cual y hace proxy de `/api/` al backend; no es un paso de build.
- **Backend**: FastAPI + SQLModel + Alembic (Python 3.12). Reglas propias en `../backend/AGENTS.md`.
- **Persistencia**: PostgreSQL 16 detrás de la API. El navegador solo mantiene **en memoria** el borrador de la venta; no usa `localStorage`.
- **Despliegue**: Docker + Easypanel, dominio con HTTPS; el backend no tiene dominio público.

## Arquitectura general
```
Navegador ──HTTPS──> Nginx (frontend) ── /          → archivos de public/
                                      └─ /api/*     → proxy_pass http://${API_UPSTREAM}/;  → FastAPI ──> PostgreSQL
```
El JS llama siempre a la base relativa `/api` más la ruta exacta del backend con su barra final (`/api/libros/`); Nginx quita el prefijo `/api`. Nunca se usa la URL ni el puerto del backend en el JS. Solo funciona servido por Nginx (p. ej. `http://127.0.0.1:8080`), no abriendo el HTML como archivo. Estructura / estilos / comportamiento separados (HTML / `css/` / `js/`).

## Integraciones externas
La API propia del proyecto (`backend/`), consumida con `fetch` a través del proxy de Nginx. No hay otras integraciones.

## Verificación
1. **Frontend** (sin suite de tests ni test runners): casos manuales G-01..G-07 de la consigna ejecutados desde Nginx / la URL pública, con el resultado real y su evidencia en `evidencia/`; validación W3C del HTML; teclado y anchos 320 px / 1280 px. Nunca se marca un caso como aprobado sin ejecutarlo.
2. **Backend**: suite `pytest` (`backend/tests/`) y casos `.http` (`backend/test/`).

## Entrega
Según la consigna (p. 9): `frontend/`, `backend/`, `README.md`, `DEPLOY.md` y `evidencia/`, sin `.env`, credenciales ni dependencias instaladas.
