# Proposal

## Why

En el Global el frontend deja de abrirse como archivo y pasa a consumir la API propia (FastAPI + PostgreSQL) con `fetch` a la base relativa `/api` (D-G02). Para eso necesita un servidor que entregue `frontend/public/` y reenvíe `/api/` al backend sin exponerlo: el Ejercicio 4 de la consigna pide esa imagen Nginx, y todos los changes de integración (I-02..I-05) solo se pueden verificar servidos desde `http://127.0.0.1:8080`, así que este change es el que los habilita.

## What Changes

- Nuevo `frontend/Dockerfile` con el contenido **exacto** de la consigna (paso 2): `FROM nginx:1.30-alpine`, `ENV NGINX_ENVSUBST_FILTER=^API_UPSTREAM$`, `COPY public/ /usr/share/nginx/html/`, `COPY default.conf.template /etc/nginx/templates/default.conf.template`, `EXPOSE 80`. Es la imagen oficial sirviendo archivos tal cual, no un paso de build (regla dura 2).
- Nuevo `frontend/.dockerignore` con `.git`, `**/.env`, `**/.env.*`, `**/node_modules`, `**/.DS_Store`.
- Nuevo `frontend/default.conf.template` (paso 3): `location /` con `try_files $uri $uri/ =404` y `location /api/` con `proxy_pass http://${API_UPSTREAM}/;` (la barra final quita el prefijo `/api`).
- Revisión de `frontend/public/` (paso 1): ningún enlace a archivos fuera de la carpeta; configuración y entorno quedan fuera de `public/`. Relevado en la propuesta: los cinco HTML solo referencian `css/`, `js/`, otras páginas de `public/` y anclas internas, por lo que no se esperan cambios en `public/`.
- `README.md` §«Ejecutar en local»: comandos en PowerShell, una línea cada uno, para levantar el backend, construir y ejecutar la imagen, y comprobar `/api/health/ready`.
- Verificación manual reproducible (paso 4) con evidencia en `evidencia/` sin secretos.

Fuera de alcance: cambios en el JS (`fetch`, `js/api.js` → I-02), en el backend (`backend/Dockerfile` ya existe), servicios de Easypanel y `DEPLOY.md` (I-06), HTTPS, cabeceras de caché o seguridad adicionales a la plantilla de la consigna.

## Capabilities

### New Capabilities
- `servidor-frontend`: cómo se entrega el sitio en ejecución — Nginx sirve los archivos estáticos de `public/` en `/`, responde 404 a rutas inexistentes, reenvía `/api/` al backend configurado en `API_UPSTREAM` quitando el prefijo, y la imagen no incluye configuración ni archivos de entorno.

### Modified Capabilities
- Ninguna. El requisito «Punto de entrada y vistas disponibles» de `navegacion-vistas` (vistas abribles «sin servidor») sigue siendo cierto tras este change, porque el JS todavía no llama a la API; deja de serlo en I-02, que es quien debe modificarlo.

## Impact

- **Archivos nuevos**: `frontend/Dockerfile`, `frontend/.dockerignore`, `frontend/default.conf.template`.
- **Archivos modificados**: `README.md` (§Ejecutar en local). `frontend/public/` sin cambios esperados.
- **Dependencias**: imagen oficial `nginx:1.30-alpine` (Docker Hub); Docker Desktop en la máquina de verificación. Sin npm ni build (regla dura 2).
- **Entorno**: nueva variable `API_UPSTREAM` (`host:puerto`, sin `http://` ni barra final) que se pasa al ejecutar el contenedor; no se versiona ningún valor real (regla dura 6).
- **Backend**: sin cambios; para verificar debe escuchar en `0.0.0.0:8000` para que el contenedor lo alcance vía `host.docker.internal`.
- **Desbloquea**: I-02..I-05 (verificación desde `http://127.0.0.1:8080`) e I-06 (servicio frontend en Easypanel).
