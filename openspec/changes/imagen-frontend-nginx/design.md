# Design

## Context

- `frontend/public/` ya existe (movido en `chore: reorganizar estructura para el Global`) con los cinco HTML, `css/estilos.css` y `js/*.js`. Relevamiento hecho en la propuesta: todos los `href`/`src` apuntan a `css/`, `js/`, páginas hermanas o anclas `#…`; no hay `../` ni `url()` en el CSS. `frontend/` no tiene todavía `Dockerfile`, `.dockerignore` ni plantilla.
- El backend (`backend/`) ya tiene `Dockerfile` propio y expone `GET /health/live` y `GET /health/ready` (`SELECT 1`). Su README lo levanta con `uvicorn app.main:app --reload`, que escucha en `127.0.0.1`; la consigna (paso 4) pide `--host 0.0.0.0 --port 8000` para que el contenedor lo alcance.
- La consigna fija literalmente el contenido del `Dockerfile` (paso 2), del `.dockerignore` (paso 2) y de `default.conf.template` (paso 3). Requisitos de comportamiento: ver `specs/servidor-frontend/spec.md`.
- El equipo trabaja en Windows con Docker Desktop y PowerShell; no hay `.gitattributes` en el repo.

## Goals / Non-Goals

**Goals:**
- Reproducir los pasos 1–4 de la consigna al pie de la letra, de modo que la corrección compare archivos idénticos a los pedidos.
- Dejar un procedimiento de verificación local repetible (PowerShell, una línea por comando) que sirva de base a I-02..I-05.

**Non-Goals:**
- Endurecer la imagen (usuario no root, `HEALTHCHECK`, cabeceras de seguridad, caché, gzip) o agregar `proxy_set_header`/timeouts: no los pide la consigna y alterarían los archivos literales.
- Orquestar frontend + backend con `docker compose` en local: la consigna usa `docker run` con el backend en el host.

## Decisions

1. **Archivos literales de la consigna, sin agregados.** `Dockerfile`, `.dockerignore` y `default.conf.template` se copian tal cual (mismas directivas, mismo orden). *Alternativa descartada*: replicar el endurecimiento de `backend/Dockerfile` (`USER`, `HEALTHCHECK`); la consigna dice «pegá estas líneas» y es lo que se evalúa (Ej. 4, 15 puntos).
2. **Sustitución acotada con `NGINX_ENVSUBST_FILTER=^API_UPSTREAM$`.** La imagen oficial procesa `/etc/nginx/templates/*.template` con `envsubst` al arrancar y escribe `/etc/nginx/conf.d/default.conf`. El filtro evita que `envsubst` toque `$uri` u otras variables de Nginx. *Alternativa*: escribir la dirección del backend fija en la conf → descartada: obligaría a reconstruir la imagen por entorno (local vs. Easypanel).
3. **Barra final en `proxy_pass http://${API_UPSTREAM}/;`.** Con `location /api/` y URI en `proxy_pass`, Nginx reemplaza el prefijo `/api/` por `/`, así `/api/libros/` llega como `/libros/` (D-G02). El JS de I-02 usará siempre la ruta exacta con barra final, porque una ruta sin ella provoca un 307 de FastAPI; el `proxy_redirect` por defecto de Nginx reescribe el `Location` a `/api/...`, pero como absoluto con el puerto de `listen` (80) y el esquema `http`: localmente el navegador va a `http://127.0.0.1/api/libros/` sin `:8080` (observado en la tarea 4.2) y detrás del HTTPS de Easypanel bajaría a `http://`.
4. **Sin respaldo SPA (`try_files … =404`).** El sitio es multipágina: una ruta inexistente debe dar 404, no `index.html`.
5. **Verificación local con backend en el host.** Backend: `alembic upgrade head`, `python -m scripts.seed` y `uvicorn app.main:app --host 0.0.0.0 --port 8000` desde `backend/` con el venv activo y `.env` configurado (PostgreSQL vía `docker compose up -d`). Frontend: desde `frontend/`, `docker build -t libreria-frontend .` y `docker run --rm --name libreria-frontend -p 127.0.0.1:8080:80 -e API_UPSTREAM=host.docker.internal:8000 libreria-frontend` en una sola línea; en Docker Desktop se omite `--add-host` (lo indica la consigna), que solo se documenta como nota para Docker Engine en Linux. Se publica en `127.0.0.1` para no exponer el sitio en la red local.
6. **README con comandos PowerShell de una línea.** §«Ejecutar en local» reemplaza el aviso «Pendiente» por los pasos de la decisión 5, en bloques ```` ```powershell ````, con rutas relativas al repo (`Set-Location backend` / `Set-Location frontend`) para que sirvan en cualquier clon. Solo nombres de variables (`DATABASE_URL`, `API_UPSTREAM`), nunca valores reales de despliegue.
7. **Evidencia sin secretos.** Capturas de `/api/health/ready` (200) y del catálogo servido en `http://127.0.0.1:8080` en `evidencia/`, con prefijo `I-01-`, sin mostrar `.env` ni `DATABASE_URL`.

## Risks / Trade-offs

- [Backend escuchando solo en `127.0.0.1` (p. ej. `--reload` sin `--host`)] → el proxy responde 502. Mitigación: el README usa `--host 0.0.0.0`; si Windows Defender pide permiso para Python, aceptar solo para redes privadas.
- [Finales de línea CRLF de Windows en `Dockerfile`/plantilla] → Docker y Nginx toleran `\r` como espacio, pero conviene guardar en LF. Mitigación: la verificación inspecciona `/etc/nginx/conf.d/default.conf` dentro del contenedor y comprueba que `proxy_pass` quedó con el valor esperado.
- [Puerto 8080 ocupado o contenedor previo con el mismo nombre] → `docker run` falla. Mitigación: `--rm` al ejecutar y, si quedó uno, `docker rm -f libreria-frontend`.
- [Tag `nginx:1.30-alpine` no disponible en el registro] → el build falla al hacer pull. Mitigación: no cambiar el tag por cuenta propia; detenerse y consultar al usuario, porque la consigna lo fija.
- [Las páginas todavía usan `localStorage`/datos locales] → servidas por Nginx se ven igual que abiertas como archivo; la integración real con la API empieza en I-02. Se acepta: este change solo verifica servido + proxy.

## Migration Plan

Change aditivo: tres archivos nuevos en `frontend/` y una sección del README. No afecta el backend ni `public/`. Rollback: borrar los tres archivos y revertir la sección del README. El despliegue en Easypanel (Build Path `/frontend`, `API_UPSTREAM=<proyecto>_backend:8000`) queda para I-06.
