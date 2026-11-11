# CHANGES — Secuencia de Implementación (Global)

> Índice canónico de los changes del **Global de Programación III: librería web integrada y desplegada en Easypanel**.
> Fuente: `docs/consignas/Consignas Global.pdf` (ejercicios 1 a 5, casos G-01 a G-07, formato de entrega).
> Cada change es atómico: un agente puede implementarlo en una sesión.
> **Leer este archivo antes de ejecutar cualquier `/opsx:propose`.**
>
> Restricciones: el frontend sigue en HTML/CSS/JS nativos con recursos locales (sin librerías, npm ni build). Los datos y los importes confirmados vienen de la API (FastAPI + PostgreSQL); el navegador solo guarda en memoria el borrador de la venta. Usar datos ficticios.
>
> Prefijo `I-` (integración) para no confundir los changes con los **casos** G-01..G-07 de la consigna.

---

## Cómo usar este documento

1. Identificá el próximo change pendiente cuyas dependencias estén todas en `[x]`.
2. Leé los archivos de "Leer antes" (consigna, routers/schemas del backend, JS del parcial).
3. Ejecutá `/opsx:propose <nombre-del-change>` y luego `/opsx:apply`.
4. Verificá a mano los casos indicados en el change (y W3C si tocaste HTML) y `/opsx:archive`.
5. Marcá el checkbox de Estado en este archivo (`[ ]` → `[x]`).

---

## Estado de partida

| Componente | Estado |
|---|---|
| `backend/` | Completo para el contrato: rutas con barra final, `limit` 1–100 / `offset` ≥ 0, `titulo` en `GET /libros/`, `PATCH /libros/{id}`, `/health/ready`, listados de autores y clientes, Dockerfile (aplica `alembic upgrade head`, `0.0.0.0:8000`), `.dockerignore`, `env.example`, `scripts.seed`. |
| `frontend/public/` | Pantallas del parcial (catálogo, libros, clientes, ventas, historial) movidas a `public/`. Todo el JS trabaja con `datos.js` + `localStorage`; **ningún `fetch`**. |
| `frontend/` (imagen) | Falta `Dockerfile`, `.dockerignore` y `default.conf.template`. |
| Docs y entrega | `DEPLOY.md` en borrador, `evidencia/` vacía, README sin "Ejecutar en local". |

---

## Árbol de dependencias

```
I-00 reglas-global
 └── I-01 imagen-frontend-nginx
       ├── I-02 cliente-http-catalogo
       │     └── I-03 altas-libros-clientes-api
       │           └── I-04 ventas-historial-api ─────┐
       └── I-05 despliegue-easypanel ─────────────────┤
                                                      └── I-06 verificacion-entrega (I-04 + I-05)
```

### Paralelismo por fase

```
GATE 0: (inicio)
  → I-00 reglas-global                      [Agente A]

GATE 1: I-00 ✓
  → I-01 imagen-frontend-nginx              [Agente A]

GATE 2: I-01 ✓                               ← FORK
  → I-02 cliente-http-catalogo              [Agente B]
  → I-05 despliegue-easypanel               [Agente A]  (primer deploy; se redespliega al final)

GATE 3: I-02 ✓
  → I-03 altas-libros-clientes-api          [Agente B]

GATE 4: I-03 ✓
  → I-04 ventas-historial-api               [Agente B]

GATE 5: I-04 ✓ + I-05 ✓
  → I-06 verificacion-entrega               [Agente A]
```

### Camino crítico (6 changes)

`I-00 → I-01 → I-02 → I-03 → I-04 → I-06`

(I-05 corre en paralelo a I-02/I-03/I-04 y solo debe estar listo antes de I-06.)

### Plan óptimo con 2 agentes

| Paso | Agente A (infra / docs) | Agente B (JavaScript) |
|------|-------------------------|------------------------|
| 1 | I-00 reglas-global | — |
| 2 | I-01 imagen-frontend-nginx | — |
| 3 | I-05 despliegue-easypanel | I-02 cliente-http-catalogo |
| 4 | — | I-03 altas-libros-clientes-api |
| 5 | — | I-04 ventas-historial-api |
| 6 | I-06 verificacion-entrega | — |

---

## FASE 0 — Preparación

### [I-00] `reglas-global`
- **Estado**: `[x]` completado (archivado en `openspec/changes/archive/2026-11-10-reglas-global`)
- **Scope**:
  - Actualizar `CLAUDE.md` y `AGENTS.md` (mantenerlos idénticos) al Global: quitar la regla dura 4 («NUNCA depender de backend…/localStorage») y reemplazarla por «los registros e importes vienen de la API vía `/api`; el navegador solo guarda el borrador de la venta en memoria»
  - Acotar la regla 1 (sin test runners) al frontend; el backend conserva su suite pytest
  - Mantener: sin frameworks/CDN/npm en el frontend, CSS externo, `textContent` para datos de usuario
  - Actualizar en `knowledge-base/` lo que contradice el Global (02 stack/persistencia, 08 arquitectura, 09 decisiones) o marcarlo como antecedente del parcial
  - Registrar decisiones abiertas: selector de autores y clientes (listado `GET /autores/` y `GET /clientes/` vs consulta por ID) — la consigna pide documentar cuál se eligió
- **Dependencias**: ninguna
- **Governance**: MEDIO (cambia reglas duras: confirmar con el grupo antes de escribir)
- **Leer antes**:
  - `docs/consignas/Consignas Global.pdf` p. 1 (Contexto y alcance)
  - `CLAUDE.md` §Reglas Duras
  - `knowledge-base/02_descripcion_general.md`, `08_arquitectura_propuesta.md`, `09_decisiones_y_supuestos.md`

---

## FASE 1 — Imagen del frontend (Ej. 4)

### [I-01] `imagen-frontend-nginx`
- **Estado**: `[x]` completado (archivado en `openspec/changes/archive/2026-11-10-imagen-frontend-nginx`)
- **Scope**:
  - `frontend/Dockerfile` exactamente como la consigna (`nginx:1.30-alpine`, `NGINX_ENVSUBST_FILTER=^API_UPSTREAM$`, dos `COPY`, `EXPOSE 80`)
  - `frontend/.dockerignore` (`.git`, `**/.env`, `**/.env.*`, `**/node_modules`, `**/.DS_Store`)
  - `frontend/default.conf.template` con `location /` (`try_files`) y `location /api/` → `proxy_pass http://${API_UPSTREAM}/;` (la barra final quita el prefijo `/api`)
  - Revisar que `public/` no tenga enlaces a archivos fuera de la carpeta y que config/entorno queden fuera de `public/`
  - Verificación manual: backend local (`alembic upgrade head`, `python -m scripts.seed`, `uvicorn` en 8000); `docker build -t libreria-frontend .`; `docker run` con `-p 127.0.0.1:8080:80 -e API_UPSTREAM=host.docker.internal:8000`; `http://127.0.0.1:8080/api/health/ready` → 200
  - Dejar los comandos (en PowerShell, una línea) en `README.md` §Ejecutar en local
- **Dependencias**: `I-00`
- **Governance**: BAJO
- **Leer antes**:
  - `docs/consignas/Consignas Global.pdf` pp. 4–5 (pasos 1 a 4)
  - `backend/README.md` (levantar API y seed en local)

---

## FASE 2 — Integración JavaScript con la API (Ej. 1–3)

> Todo `fetch` usa la base `/api` + la ruta exacta del backend **con su barra final** (`/api/libros/`). Solo funciona servido por Nginx (I-01): verificar siempre en `http://127.0.0.1:8080`, no abriendo el HTML como archivo.
> El backend responde los errores como `{"detail": ...}`; en 422 `detail` es una lista de errores de validación.

### [I-02] `cliente-http-catalogo`
- **Estado**: `[x]` completado (archivado en `openspec/changes/archive/2026-11-10-cliente-http-catalogo`)
- **Scope**:
  - Nuevo módulo `js/api.js`: base `/api` centralizada, helper de `fetch` (JSON, método, cuerpo), distingue error de red vs respuesta HTTP y extrae el mensaje de `detail` (string o lista 422)
  - Catálogo (`index.html` + `catalogo.js`): `GET /libros/?titulo=&limit=&offset=`; búsqueda parcial sin distinguir mayúsculas la hace el backend
  - Paginación con `limit` (1–100, por defecto 20) y `offset` (≥ 0): botones anterior/siguiente; al cambiar el filtro, `offset = 0`
  - Columnas: título, ISBN, precio, editorial, género («Sin clasificar» si `genero` es `null`)
  - Detalle de libro con `GET /libros/{id}` para mostrar autores (rol y orden)
  - Cuatro estados distintos y visibles: cargando, lista vacía, búsqueda sin coincidencias, error de conexión
  - Dejar de cargar `datos.js`/`persistencia.js` en `index.html`
  - Verificación manual: caso **G-01** (buscar, paginar, búsqueda sin coincidencias, detalle)
- **Dependencias**: `I-01`
- **Governance**: MEDIO
- **Leer antes**:
  - `docs/consignas/Consignas Global.pdf` p. 2 (Ejercicio 1)
  - `backend/app/modules/libros/router.py`, `schemas.py` (`LibroRead`, `LibroDetalleRead`)
  - `backend/app/core/pagination.py`
  - `frontend/public/js/catalogo.js`, `frontend/public/index.html`

### [I-03] `altas-libros-clientes-api`
- **Estado**: `[x]` completado (archivado en `openspec/changes/archive/2026-11-11-altas-libros-clientes-api`)
- **Scope**:
  - `libros.html`: agregar campo **stock** (entero ≥ 0); editorial y género cargados desde `GET /editoriales/` y `GET /generos/` (género opcional)
  - Reemplazar los checkboxes fijos de autores por un editor de autorías: `autor_id` (verificado con `GET /autores/{id}` mostrando el nombre, o elegido del listado `GET /autores/`), `rol` (autor, coautor, traductor, ilustrador) y `orden` (≥ 1); exigir ≥ 1 autoría en el front (el backend acepta lista vacía)
  - `POST /libros/` con `{isbn, titulo, precio, stock, editorial_id, genero_id, autores:[{autor_id, rol, orden}]}`
  - `clientes.html`: el campo `nombreCompleto` se envía como **`nombre`**; `POST /clientes/` con `{nombre, email}` (el backend rechaza campos extra con 422)
  - Listado/búsqueda de clientes desde la API (`GET /clientes/` o `GET /clientes/{id}`)
  - Validaciones del lado del cliente antes de enviar; resultado junto al formulario; 201 → usar el registro devuelto para refrescar vistas relacionadas; 409/422 → mostrar el mensaje del servidor
  - Quitar la dependencia de `datos.js`/`persistencia.js` en estas páginas
  - Verificación manual: casos **G-02** (libro con stock, género opcional y autorías; ISBN repetido → 409) y **G-03** (cliente, recuperar por ID; email repetido → 409)
- **Dependencias**: `I-02` (usa `js/api.js`)
- **Governance**: MEDIO
- **Leer antes**:
  - `docs/consignas/Consignas Global.pdf` p. 2 (Ejercicio 2 y recuadro «Consultas por ID»)
  - `backend/app/modules/libros/schemas.py` (`LibroCreate`, `LibroAutorCreate`, `ROLES_PERMITIDOS`)
  - `backend/app/modules/clientes/schemas.py`, `autores/router.py`, `editoriales/router.py`, `generos/router.py`
  - `frontend/public/js/altas.js`, `validaciones.js`, `libros.html`, `clientes.html`

### [I-04] `ventas-historial-api`
- **Estado**: `[ ]` pendiente
- **Scope**:
  - Borrador de venta **en memoria**: cliente desde la API, libros desde el catálogo de la API, cambiar cantidades, quitar renglones
  - Validación previa: ≥ 1 renglón, cantidades enteras positivas, un solo renglón por libro
  - `POST /ventas/` con **solo** `{cliente_id, renglones:[{libro_id, cantidad}]}`; botón deshabilitado mientras se envía
  - 201 → mostrar precios unitarios, subtotales y total **de la respuesta** (no recalculados), limpiar el formulario y refrescar el historial
  - 409 (cliente/libro inexistente) y 422 (renglones repetidos, cuerpo inválido) → mostrar mensaje y **conservar el borrador**
  - Historial: `GET /ventas/?limit=&offset=` con paginación; detalle `GET /ventas/{id}` con fecha, cliente, renglones e importes históricos
  - Eliminar `persistencia.js` y `datos.js` (o dejarlos sin referencias) y limpiar los `<script>` de las 5 páginas
  - Verificación manual: casos **G-04** (venta con dos renglones, 201, detalle tras recargar), **G-05** (`PATCH /libros/{id}` cambia el precio; la venta anterior conserva sus importes) y **G-06** (ID inexistente → 409; renglones repetidos → 422; el historial no cambia)
- **Dependencias**: `I-03` (selector de clientes y catálogo vía API)
- **Governance**: MEDIO
- **Leer antes**:
  - `docs/consignas/Consignas Global.pdf` p. 3 (Ejercicio 3)
  - `backend/app/modules/ventas/router.py`, `schemas.py` (`VentaCreate`, `VentaRead`, `RenglonRead`)
  - `frontend/public/js/ventas.js`, `historial.js`, `ventas.html`, `historial.html`

---

## FASE 3 — Despliegue y entrega (Ej. 5)

### [I-05] `despliegue-easypanel`
- **Estado**: `[ ]` pendiente
- **Scope**:
  - Verificar `backend/` listo (código, `requirements.txt`, `alembic.ini`, `migrations/`, `env.example`, Dockerfile, `.dockerignore`) y pushear con los Dockerfiles y la plantilla de Nginx
  - Servicio App **backend**: Build Path `/backend`, builder Dockerfile; `DATABASE_URL` (`postgresql+asyncpg`) en Environment; Postgres privado; confirmar `alembic upgrade head` en logs; salud desde Shell → 200; correr `python -m scripts.seed` (vacía tablas: revisar antes); **sin dominio público**
  - Servicio App **frontend**: Build Path `/frontend`, builder Dockerfile; `API_UPSTREAM=<proyecto>_backend:8000`; dominio HTTPS → HTTP puerto 80
  - Comprobar `https://<dominio>/api/health/ready` → 200 y catálogo con datos
  - Completar `DEPLOY.md`: URL pública, revisión (commit), rutas de build, puertos, proxy, nombres de variables, migraciones, carga inicial, pasos de actualización y tabla de diagnóstico usada
  - Nunca commitear valores reales; ocultarlos en capturas
- **Dependencias**: `I-01` (se redespliega tras I-04)
- **Governance**: ALTO (credenciales de la base y datos del VPS: proponer y esperar confirmación antes de cada paso con efectos)
- **Leer antes**:
  - `docs/consignas/Consignas Global.pdf` pp. 6–8 (pasos 5 a 8)
  - `DEPLOY.md`, `docs/antecedentes/tp-backend/DEPLOY.md`
  - `backend/Dockerfile`, `backend/env.example`, `backend/scripts/seed.py`

### [I-06] `verificacion-entrega`
- **Estado**: `[ ]` pendiente
- **Scope**:
  - Redesplegar la versión final y ejecutar **G-01 a G-07** desde la URL pública con datos ficticios
  - Registrar por caso: pasos, resultado observado real y evidencia en `evidencia/` (sin marcar como aprobado lo no ejecutado)
  - **G-07**: la imagen del frontend se construye, la URL abre por HTTPS, salud 200 y los datos siguen tras un redespliegue
  - Demostración mínima: catálogo, venta con dos renglones, reabrir el detalle tras recargar, importes iguales a los de la API
  - `README.md`: grupo, ejecución local completa (backend + imagen frontend), carga de datos de prueba, decisión de selectores (listado vs ID)
  - Validación W3C de las páginas modificadas
  - Armar el ZIP: `frontend/`, `backend/`, `README.md`, `DEPLOY.md`, `evidencia/`; sin `.env`, credenciales ni dependencias instaladas
- **Dependencias**: `I-04`, `I-05`
- **Governance**: MEDIO
- **Leer antes**:
  - `docs/consignas/Consignas Global.pdf` p. 9 (casos, criterios y formato de entrega)
  - `README.md`, `DEPLOY.md`

---

## Resumen

| ID | Change | Ej. | Pts | Dependencias | Governance |
|----|--------|-----|-----|--------------|------------|
| I-00 | `reglas-global` | — | — | — | MEDIO |
| I-01 | `imagen-frontend-nginx` | 4 | 15 | I-00 | BAJO |
| I-02 | `cliente-http-catalogo` | 1 | 20 | I-01 | MEDIO |
| I-03 | `altas-libros-clientes-api` | 2 | 20 | I-02 | MEDIO |
| I-04 | `ventas-historial-api` | 3 | 25 | I-03 | MEDIO |
| I-05 | `despliegue-easypanel` | 5 | 20* | I-01 | ALTO |
| I-06 | `verificacion-entrega` | 5 | 20* | I-04, I-05 | MEDIO |

\* Los 20 puntos de «Despliegue y verificación» se reparten entre I-05 e I-06.

**Primer change recomendado**: `I-00` (`reglas-global`) — `/opsx:propose reglas-global`

---

## Antecedente — Primer parcial (completado)

Los seis changes del parcial (frontend 100 % en el navegador con `localStorage`) están archivados en `openspec/changes/archive/2026-10-1*` y `2026-10-20-*`. Sus specs viven en `openspec/specs/`.

| ID | Change | Estado |
|----|--------|--------|
| C-01 | `estructura-pantallas-html` | `[x]` |
| C-02 | `presentacion-css-adaptable` | `[x]` |
| C-03 | `datos-locales-catalogo-filtro` | `[x]` |
| C-04 | `alta-libros-clientes` | `[x]` |
| C-05 | `venta-simulada-historial` | `[x]` |
| C-06 | `persistencia-readme` | `[x]` |

> Las specs `datos-locales` y `venta-simulada` describen el comportamiento con `localStorage`; I-02..I-04 deben modificarlas (delta specs) para reflejar la API.
