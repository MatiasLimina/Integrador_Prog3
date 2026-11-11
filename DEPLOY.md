# DEPLOY — Librería en Easypanel

> Ejercicio 5 (I-05). Este archivo no contiene credenciales, URL de la base ni IP del VPS: esos valores viven solo en Environment de cada servicio de Easypanel. El despliegue anterior del TP backend (`docker run` manual en el puerto 8000) está en `docs/antecedentes/tp-backend/DEPLOY.md` (en el repositorio) y se retiró al final de este despliegue (ver «Backend del TP (retirado)»).

## URL pública

https://libreria.matiaslimina.me/

- Salud de la API: `https://libreria.matiaslimina.me/api/health/ready`
- Catálogo (API): `https://libreria.matiaslimina.me/api/libros/?limit=5&offset=0`

## Revisión desplegada

- Commit de `main`: `8dd4865` (revisión desplegada en `backend` y `frontend` en el redespliegue final de I-06). Los commits posteriores son solo documentación y evidencia: `git diff --stat 8dd4865 HEAD -- frontend backend` solo lista `backend/README.md` (enlaces a `docs/` pasados a texto); el código desplegado es idéntico.
- Fecha del despliegue: 2026-11-11 (redespliegue final de `backend` y `frontend`, ~22:49 UTC)
- Mantener la URL operativa durante la corrección.

## Servicios

Proyecto de Easypanel: `gordos_programacion`.

| Servicio | Tipo | Build Path | Builder | Puerto interno | Dominio |
|---|---|---|---|---|---|
| `global_db` | Postgres | — | — | 5432 | ninguno ni puerto público (solo red interna) |
| `backend` | App | `/backend` | Dockerfile | 8000 | ninguno (solo red interna) |
| `frontend` | App | `/frontend` | Dockerfile | 80 | HTTPS asignado → HTTP puerto 80 |

Fuente de ambos servicios App: este repositorio, rama `main`.

## Base de datos

- Motor: PostgreSQL, servicio `global_db` del proyecto `gordos_programacion`, creado desde Easypanel (+ Service → Postgres). Easypanel genera la base, el usuario y la clave.
- Sin puerto público: el backend llega por la red interna de Easypanel (host interno `<proyecto>_<servicio>`, aquí `gordos_programacion_global_db`).
- La «Internal Connection URL» de Easypanel termina en `?sslmode=disable`: hay que **quitar ese parámetro** (o usar `?ssl=disable`), porque asyncpg no acepta `sslmode` (ver Diagnóstico).
- La conexión real (`DATABASE_URL`) no se publica; está solo en Environment del servicio `backend`.
- Es una base distinta de `gordos_programacion_db` / `libreria` (la del TP), que no se toca.

## Orden de despliegue

1. Servicio Postgres `global_db`.
2. Servicio `backend` (migraciones al arrancar, salud, sin dominio).
3. Carga inicial (una sola vez).
4. Servicio `frontend`.

El backend va antes que el frontend: Nginx resuelve el nombre de `API_UPSTREAM` al arrancar; si `gordos_programacion_backend` todavía no existe falla con `host not found in upstream` y el contenedor queda reiniciándose.

## Proxy

Nginx sirve `public/` y reenvía `/api/` a `http://${API_UPSTREAM}/` (quita el prefijo `/api`). El navegador nunca habla con el backend directamente; el JS usa la base relativa `/api` más la ruta exacta con barra final (`/api/libros/`).

## Variables de entorno (solo nombres)

| Servicio | Variable | Forma del valor | Dónde se configura |
|---|---|---|---|
| backend | `DATABASE_URL` | `postgresql+asyncpg://<usuario>:<clave>@<host-interno>:5432/<base>` (la «Internal Connection URL» de `global_db` con el esquema cambiado a `postgresql+asyncpg://` y sin `?sslmode=disable`) | Environment de `backend` |
| backend | `DB_ECHO` (opcional) | `false` | Environment de `backend` |
| frontend | `API_UPSTREAM` | `gordos_programacion_backend:8000` (host:puerto, sin `http://` ni barra final) | Environment de `frontend` |

Ejemplos con valores de muestra: [backend/env.example](backend/env.example) y [frontend/env.example](frontend/env.example).

## Migraciones

El `CMD` de `backend/Dockerfile` ejecuta `alembic upgrade head` antes de `uvicorn` en cada arranque. En el primer despliegue sobre una base vacía los logs muestran `Running upgrade  -> 5600df0fc99c` y `Running upgrade 5600df0fc99c -> 9df0eb6a1dd6` y después `Uvicorn running on http://0.0.0.0:8000`. En un redespliegue sin revisiones nuevas no aparece ningún `Running upgrade`. Si la migración falla, el contenedor termina y no se sirven peticiones.

Resultado observado: el primer arranque falló con `TypeError: connect() got an unexpected keyword argument 'sslmode'` (ver Diagnóstico); con la URL corregida el backend arrancó y desde la Console `wget -qO- http://127.0.0.1:8000/health/ready` devolvió `{"estado":"listo","base_de_datos":"disponible"}`, y `/libros/`, `/clientes/` y `/ventas/` devolvieron `[]` (las tablas existen: migraciones aplicadas). Evidencia: [I-05-backend-salud-tablas-vacias.png](evidencia/I-05-backend-salud-tablas-vacias.png).

## Carga inicial

Se ejecuta **una sola vez**, desde la Console/Terminal del servicio `backend` en Easypanel:

```sh
python -m scripts.seed
```

> **Advertencia:** el seed ejecuta `TRUNCATE … RESTART IDENTITY CASCADE` sobre todas las tablas y recarga datos ficticios. Antes de correrlo se comprueba que las tablas están vacías (`wget -qO- "http://127.0.0.1:8000/libros/?limit=1&offset=0"` devuelve `[]`; igual para `/clientes/` y `/ventas/`). Nunca se corre en una actualización ni sobre una base con datos reales.

Resultado observado: con las tres tablas en `[]` se corrió el seed una vez; `wget -qO- "http://127.0.0.1:8000/libros/?limit=2&offset=0"` devolvió *Rayuela* y *Antología de la literatura fantástica* (esta última con `genero: null`, que el Catálogo muestra como «Sin clasificar»). Evidencia: [I-05-seed-libros.png](evidencia/I-05-seed-libros.png).

## Pasos de actualización

1. Publicar el commit en `main`.
2. Easypanel → servicio `backend` → Deploy. Revisar Logs (migraciones nuevas, si las hay, y `Uvicorn running`).
3. Comprobar la salud desde la Console del backend: `wget -qO- http://127.0.0.1:8000/health/ready` → 200.
4. Solo si cambió `frontend/`: servicio `frontend` → Deploy.
5. Comprobar `https://libreria.matiaslimina.me/api/health/ready` y que los datos previos siguen presentes.

**No volver a correr el seed** al actualizar: vacía todas las tablas.

## Diagnóstico

Tabla del paso 8 de la consigna. La columna «Usado» se completa con lo que realmente pasó.

| Síntoma | Dónde mirar | Causas habituales | Usado |
|---|---|---|---|
| El build falla o no encuentra archivos | Logs del build del servicio | Build Path incorrecto (`/backend`, `/frontend`), nombre del Dockerfile, archivo no versionado | No |
| El frontend no arranca o `/api/` responde 502 | Logs del servicio `frontend` | `API_UPSTREAM` mal escrito, nombre interno del backend incorrecto, puerto distinto de 8000, backend todavía no desplegado (`host not found in upstream`) | No (se desplegó el backend primero) |
| El backend se reinicia o `/health/ready` no da 200 | Logs del servicio `backend` | `DATABASE_URL` ausente, con driver distinto de `postgresql+asyncpg` o con host/clave incorrectos; migración fallida; parámetros de la URL que el driver no acepta | **Sí**: el backend se reiniciaba con `TypeError: connect() got an unexpected keyword argument 'sslmode'` durante `alembic upgrade head`. Causa: la «Internal Connection URL» trae `?sslmode=disable` (sintaxis de libpq/psycopg). Corrección: quitar el parámetro de `DATABASE_URL` y redesplegar |
| El Catálogo falla pero la página abre | Pestaña Red del navegador | Falta el prefijo `/api`, falta la barra final (el 307 baja a `http://`), URL del backend escrita en el JS | No |

## Backend del TP (retirado)

Decisión del grupo: el contenedor `libreria` del TP (`docker run` manual, puerto 8000, ver el antecedente) se retira cuando el despliegue del Global pasa sus comprobaciones públicas. No aparece en Easypanel, así que se hace por SSH: `docker rm -f libreria` y `ufw delete allow 8000/tcp`. Se conserva `gordos_programacion_db` y su base `libreria` (no se borra ningún dato).

Estado: **retirado el 2026-11-11**. Se ejecutaron ambos comandos (`ufw` borró la regla en IPv4 e IPv6). Comprobado desde afuera: `http://matiaslimina.me:8000/health/ready` ya no responde (timeout), mientras `https://libreria.matiaslimina.me/api/health/ready` sigue en 200.

## Comprobaciones públicas

| Comprobación | Resultado | Evidencia |
|---|---|---|
| `https://libreria.matiaslimina.me/api/health/ready` | 200 `{"estado":"listo","base_de_datos":"disponible"}` | [I-05-publico-health-ready.png](evidencia/I-05-publico-health-ready.png) |
| Catálogo público con datos del seed | Lista *Rayuela*, *Antología…*, *El Aleph*, etc. | [I-05-publico-catalogo.png](evidencia/I-05-publico-catalogo.png) |
| `curl -I https://libreria.matiaslimina.me/ventas.html` | `HTTP/1.1 200 OK` | — |
| Logs de Nginx | `GET /api/libros/?limit=20&offset=0` → 200 a través del proxy | — (no versionada: muestra IP del cliente) |
| Persistencia | El cliente de prueba (ID 3) sigue tras redesplegar `backend` | [I-05-persistencia-cliente.png](evidencia/I-05-persistencia-cliente.png) |

## Casos G-01 a G-07

Resultados y evidencia de los casos G-01 a G-07 en la tabla de [README.md](README.md#verificación-g-01-a-g-07) (capturas `G-0X-*` en [evidencia/](evidencia/)).
