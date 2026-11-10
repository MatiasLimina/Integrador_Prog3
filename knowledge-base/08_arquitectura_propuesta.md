# 08 — Arquitectura propuesta

> Vigente para el **Global**. La arquitectura del parcial (sin servidor, `localStorage`) es antecedente: ver [../CHANGES.md](../CHANGES.md).

## Patrones
- Separación estructura (HTML) / presentación (CSS) / comportamiento (JS).
- Cliente HTTP centralizado (`js/api.js`, I-02): base `/api` en un solo lugar, helper de `fetch` (JSON, método, cuerpo), distinción entre error de red y respuesta HTTP, y extracción del mensaje de `detail` (string o lista 422).
- Funciones acotadas con responsabilidades reconocibles: acceso a la API, validaciones puras, renderizado, manejadores de eventos.
- El borrador de venta vive solo en memoria; importes y registros confirmados siempre vienen de la respuesta de la API.
- Ids en los datos; el HTML expone ids, `name` y `data-*` para JS.

## Estructura de directorios
```
frontend/
  Dockerfile, .dockerignore, default.conf.template   (imagen Nginx, I-01)
  public/                                            (HTML, css/, js/, assets/)
backend/                                             (FastAPI + Alembic + scripts.seed; reglas en backend/AGENTS.md)
docs/consignas/                                      (consigna del Global)
evidencia/                                           (capturas, sin secretos)
README.md, DEPLOY.md, CHANGES.md
```

## Seguridad
- Todo dato escrito por usuarios o devuelto por la API se inserta como texto con `textContent`, nunca como HTML (RN-04).
- Secretos fuera del repo: no se versiona `.env`, credenciales ni valores reales de despliegue; solo nombres de variables en `backend/env.example`. Se ocultan en las capturas de `evidencia/`.
- El backend no se publica: el único camino desde el navegador es el proxy `/api/` de Nginx.

## Verificación y calidad
Frontend: sin test runners; casos manuales G-01..G-07 y validación W3C. Backend: `pytest` (`backend/tests/`) y `.http` (`backend/test/`).

## Variables de entorno
- `API_UPSTREAM` (frontend): `host:puerto` del backend para el proxy de Nginx (p. ej. `host.docker.internal:8000` en local, `<proyecto>_backend:8000` en Easypanel). La imagen solo sustituye esta variable (`NGINX_ENVSUBST_FILTER=^API_UPSTREAM$`).
- `DATABASE_URL` (backend): conexión a PostgreSQL con el driver `postgresql+asyncpg`; solo en el entorno del servicio, nunca en el repo.
