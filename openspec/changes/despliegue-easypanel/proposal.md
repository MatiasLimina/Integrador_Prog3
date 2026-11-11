# Proposal

## Why

El Ejercicio 5 de la consigna del Global (pasos 5 a 8, pp. 6–8; 20 puntos repartidos con I-06) exige que la librería quede publicada en Easypanel: un servicio App **backend** sin dominio público conectado a una PostgreSQL privada, y un servicio App **frontend** (la imagen Nginx de I-01) que se publica por HTTPS y reenvía `/api/` al backend por la red interna. Sin este despliegue no se pueden ejecutar los casos G-01..G-07 desde la URL pública (I-06), y la cátedra corrige el funcionamiento observado en esa URL.

## What Changes

**Del lado del repositorio (lo hace el agente):**
- Auditoría de preparación de `backend/` (paso 5). Relevada en esta propuesta: `requirements.txt`, `alembic.ini` (sin URL), `migrations/` (dos revisiones, `5600df0fc99c` → `9df0eb6a1dd6`), `env.example`, `Dockerfile` y `.dockerignore` están versionados. El `Dockerfile` cumple lo que pide la consigna (instala dependencias, copia `migrations/`, `CMD` con `alembic upgrade head` y `uvicorn` en `0.0.0.0:8000`, `HEALTHCHECK` sobre `/health/ready`), aunque parte de `python:3.12-alpine` en lugar de `-slim`: se conserva, porque la consigna solo da el ejemplo «si tu backend todavía no tiene Dockerfile».
- **Brecha 1** — `backend/.dockerignore` no usa los patrones recursivos de la consigna: tiene `.env`, `.env.*`, `.venv/`, `__pycache__/`, `.pytest_cache/` (solo en la raíz del contexto) en vez de `**/.env`, `**/.env.*`, `**/.venv`, `**/__pycache__`, `**/.pytest_cache`. Un `.env` o caché en una subcarpeta entraría al contexto de build. Se alinea con la consigna conservando las entradas extra que ya tiene.
- **Brecha 2** — No hay archivo de ejemplo con el nombre de la variable del frontend (`API_UPSTREAM`); la consigna (p. 9) pide «un archivo de ejemplo con los nombres de las variables». Se agrega `frontend/env.example` (fuera de `public/`, no entra en la imagen).
- **Brecha 3** — `backend/env.example` solo muestra la `DATABASE_URL` local (`localhost`); se agrega un comentario con la forma que toma en Easypanel (host interno del servicio Postgres, driver `postgresql+asyncpg`), con valores de muestra.
- `DEPLOY.md` completo (paso 8 y p. 9): URL pública, revisión (commit), rutas de build, puertos, proxy, nombres de variables, migraciones, carga inicial, pasos de actualización, orden de despliegue y tabla de diagnóstico usada.
- Chequeo de secretos antes de pushear: ningún `.env` versionado, sin credenciales en el árbol ni en `evidencia/`.

**En Easypanel (lo ejecuta el grupo, gobernanza ALTA — cada paso con efectos espera confirmación explícita). Todo se hace desde la interfaz web de Easypanel (sin SQL ni CLI en el VPS), salvo el último punto:**
- Servicio **Postgres nuevo `global_db`** en el proyecto `gordos_programacion` (+ Service → Postgres): Easypanel genera la base, el usuario y la clave y muestra una «Internal Connection URL». La `DATABASE_URL` del backend es esa URL con el esquema cambiado a `postgresql+asyncpg://` (host interno `gordos_programacion_global_db`). Reemplaza la idea anterior de crear una base `libreria_global` por SQL dentro de `gordos_programacion_db`.
- Servicio App `backend` (Build Path `/backend`, Dockerfile), `DATABASE_URL` en Environment, migraciones confirmadas en logs, salud 200 desde la Console/Terminal del servicio (`wget -qO- http://127.0.0.1:8000/health/ready`), carga inicial con `python -m scripts.seed` (**vacía todas las tablas**; con `global_db` recién creado están vacías, pero se verifica antes), sin dominio público.
- Servicio App `frontend` (Build Path `/frontend`, Dockerfile), `API_UPSTREAM=gordos_programacion_backend:8000`, dominio HTTPS → HTTP puerto 80.
- Comprobación pública: `https://<dominio>/api/health/ready` → 200, catálogo con datos y datos que siguen tras un redespliegue del backend; evidencia `evidencia/I-05-*.png` con valores privados ocultos.
- **Retiro del backend del TP (decisión del grupo; las notas ya están publicadas):** el contenedor `libreria` (lanzado a mano con `docker run -p 8000:8000`, ver `docs/antecedentes/tp-backend/DEPLOY.md`) no aparece en Easypanel, así que es el **único paso por SSH**: `docker rm -f libreria` y `ufw delete allow 8000/tcp`. Se hace **después** de que el despliegue del Global pase sus comprobaciones públicas, para que no quede un hueco sin servicio. El servicio `gordos_programacion_db` y su base `libreria` **no se tocan** (no se borra nada de datos).

Fuera de alcance: ejecutar G-01..G-07 completos, README de entrega y ZIP (I-06); cambios de comportamiento en el JS o en la API; endurecer la imagen Nginx (cabeceras, caché); borrar el servicio `gordos_programacion_db` o su base `libreria` (solo se retira el contenedor del TP y su regla de firewall).

## Capabilities

### New Capabilities
- `despliegue`: cómo queda publicada la aplicación — el frontend responde por HTTPS en el dominio asignado, la API solo es accesible a través del proxy `/api/` (backend y PostgreSQL sin exposición pública), el esquema se migra al arrancar el backend, los datos sobreviven a un redespliegue y la configuración vive solo en el entorno privado de cada servicio, con el procedimiento documentado en `DEPLOY.md`.

### Modified Capabilities
- Ninguna. `servidor-frontend` ya exige `API_UPSTREAM` configurable al iniciar y el proxy sin prefijo; el despliegue lo usa sin cambiar esos requisitos.

## Impact

- **Archivos modificados**: `backend/.dockerignore`, `backend/env.example` (solo comentario), `DEPLOY.md`.
- **Archivos nuevos**: `frontend/env.example`; capturas `evidencia/I-05-*.png`.
- **Backend**: sin cambios de código; `pytest` debe seguir pasando (regla de `backend/AGENTS.md`).
- **Sistemas externos**: VPS con Easypanel del grupo (servicios nuevos `global_db` (Postgres), `backend` y `frontend` en el proyecto `gordos_programacion`) y, por SSH, retiro del contenedor `libreria` del TP y de la regla `ufw` del puerto 8000. Efectos irreversibles posibles: migraciones y seed (`TRUNCATE ... RESTART IDENTITY CASCADE`) sobre `global_db` (recién creada, vacía) y la baja del backend del TP.
- **Secretos**: `DATABASE_URL` real (y la Internal Connection URL de `global_db`) solo en Environment de Easypanel; nunca en el repo ni visible en capturas (regla dura 6, D-G05).
- **Desbloquea**: I-06 (verificación desde la URL pública). Se redespliega tras I-04 y al cierre en I-06.
