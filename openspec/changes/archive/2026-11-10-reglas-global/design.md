# Design

## Context

Ver `proposal.md` — Why. Estado observado al proponer (2026-11-10):

- `CLAUDE.md` y `AGENTS.md` son idénticos (`diff` vacío) y siguen titulados «Parcial_Front». Su tabla de Stack dice «Persistencia: `localStorage`» y «Backend / Integraciones: Ninguno»; la regla dura 4 prohíbe depender de backend/API/BD; el resumen del roadmap apunta a C-01..C-06; la nota de preguntas abiertas remite a C-01/C-05/C-06; la tabla de skills declara que `fastapi-python` y `python-testing-patterns` «no aplican».
- `CHANGES.md` ya está reescrito para el Global (I-00..I-06) y su cabecera ya contiene la restricción nueva: «Los datos y los importes confirmados vienen de la API […]; el navegador solo guarda en memoria el borrador de la venta».
- `knowledge-base/` describe solo el parcial: `01` pone API/backend/`fetch` fuera de alcance; `02` dice «100 % cliente», «Integraciones: ninguna», «Persistencia: `localStorage`» y «sin tests automáticos» (global); `03` dice «datos locales por navegador»; `04` modela `autorIds`, `nombre completo` y `localStorage`; `06`/`07` hablan de puntos y casos de `localStorage`; `08` dice «sin servidor» y «Variables de entorno / build: no aplica»; `09` D-02 y D-03 contradicen el Global; `10` pregunta por claves de `localStorage`.
- `backend/` ya cumple el contrato: `GET /autores/` y `GET /clientes/` (paginados, `limit` 1–100, sin filtro por nombre), `GET /autores/{id}`, `GET /clientes/{id}`, `ClienteCreate` con `extra="forbid"` y campo `nombre`, `LibroCreate.autores` con `default_factory=list` (acepta lista vacía). Tiene su propio `backend/AGENTS.md` (canónico) + `backend/CLAUDE.md` (`@AGENTS.md`), con reglas solo de backend y suite `pytest`.
- `frontend/public/js/` no tiene ningún `fetch`; usa `datos.js` + `persistencia.js`.

Restricción de gobernanza: el change modifica reglas duras (MEDIO) → la redacción de §Decisiones D1 se confirma con el grupo antes de escribir (ver `tasks.md` 1.x).

## Goals / Non-Goals

**Goals:**
- Que ninguna regla dura vigente contradiga la consigna del Global ni el alcance de I-01..I-06.
- Que `CLAUDE.md` y `AGENTS.md` sigan siendo idénticos byte a byte.
- Que la KB deje de afirmar como vigente algo del parcial que el Global reemplaza, sin perder el antecedente.
- Dejar registrada (y recomendada) la decisión de selectores que la consigna pide documentar.

**Non-Goals:**
- Tocar código de `frontend/` o `backend/`, ni `openspec/specs/` (delta specs en I-02..I-04).
- Reescribir el README raíz o `DEPLOY.md` (I-01, I-05, I-06).
- Reescribir en profundidad `05_reglas_de_negocio.md`, `06` o `07`: sus reglas de negocio (ISBN, precio histórico, validaciones) siguen vigentes; solo se marcan como antecedente donde hablan de `localStorage`.
- Modificar `backend/CLAUDE.md` / `backend/AGENTS.md`: ya rigen solo `backend/` y no mencionan el frontend ni `localStorage`; no hay contradicción.

## Decisions

### D1 — Redacción de las reglas duras (texto aprobado por el grupo)

> **Checkpoint 1.1: aprobado por el grupo el 2026-11-10, sin cambios.** Las reglas 1–6 se escriben verbatim como figuran abajo.

Reemplaza completa la sección «Reglas Duras» de `CLAUDE.md`/`AGENTS.md`. El párrafo introductorio pasa a decir que el override de Strict TDD vale **solo para el frontend**. Texto propuesto, verbatim:

> 1. **NUNCA instalar Jest/Vitest/Playwright ni crear archivos de test en `frontend/`** → el frontend no tiene suite de tests ni test runners; el módulo Strict TDD del global NO aplica al frontend (override explícito). Verificar a mano los casos G-01..G-07 de la consigna registrando el resultado real y su evidencia, y validar el HTML en el W3C validator. El backend conserva su suite `pytest` (`backend/tests/`) y sus casos `.http` (`backend/test/`): si un change toca `backend/`, rige `backend/AGENTS.md` y `pytest` debe seguir pasando.
> 2. **NUNCA usar frameworks, librerías, CDNs, npm, `package.json` ni herramientas de build en el frontend** → solo HTML, CSS y JavaScript nativos, con todos los recursos locales en `frontend/public/`. La imagen oficial de Nginx (`frontend/Dockerfile`) sirve esos archivos tal cual; no es un paso de build. Las dependencias del backend viven solo en `backend/requirements*.txt`.
> 3. **NUNCA usar CSS inline ni `<style>` embebido para la identidad visual** → CSS en archivos externos en `frontend/public/css/`, reutilizando clases.
> 4. **NUNCA guardar en el navegador registros ni importes confirmados, ni calcularlos por cuenta propia** → libros, clientes, ventas e importes vienen de la API (FastAPI + PostgreSQL) con `fetch` a la base relativa `/api` más la ruta exacta del backend con su barra final (`/api/libros/`); nunca la URL ni el puerto del backend en el JS. El navegador solo mantiene **en memoria** el borrador de la venta (sin `localStorage`). Usar datos ficticios.
> 5. **NUNCA insertar como HTML (`innerHTML`) datos escritos por usuarios ni datos que vuelven de la API** → insertarlos como texto en el DOM con `textContent`.
> 6. **NUNCA versionar `.env`, credenciales ni valores reales de despliegue** → solo nombres de variables en archivos de ejemplo (`backend/env.example`); ocultar contraseñas y valores privados en las capturas de `evidencia/`.

Rationale por regla:
- **1**: la consigna del Global no pide tests de frontend y el grupo verifica a mano; pero `backend/` trae su suite `pytest` (23 módulos `test_*.py`) que forman parte de la entrega (`backend/`) y no pueden quedar «prohibidos» por una regla raíz. Alternativa descartada: eliminar la regla 1 entera (habilitaría Strict TDD sobre el frontend, sin runner instalable por la regla 2).
- **2**: FastAPI, SQLModel, etc. son librerías; sin acotar, la regla 2 contradice al backend. Se nombra Nginx explícitamente porque I-01 introduce un `Dockerfile` y un agente podría leerlo como «build tool».
- **4**: traduce la p. 1 de la consigna («Los registros y los importes confirmados provienen de la API […]. La interfaz puede mantener en memoria el borrador de una venta») y las notas de FASE 2 de `CHANGES.md` (base `/api`, barra final). «Ni calcularlos por cuenta propia» cubre I-04 (mostrar subtotales y total de la respuesta, no recalculados); el cálculo provisorio del borrador antes de confirmar no es un «importe confirmado». Se prohíbe la URL/puerto del backend porque el proxy de Nginx es el único camino que funciona desplegado (backend sin dominio público, I-05). Alternativa descartada: permitir `localStorage` para el borrador — la consigna dice «en memoria» y persistir el borrador reintroduce el estado local que el Global elimina.
- **5**: igual que antes, extendida a datos de la API porque ahora esos datos provienen de altas hechas por cualquier usuario del despliegue público.
- **6** (nueva): la consigna p. 9 exige excluir `.env` y credenciales del ZIP y ocultar valores privados en capturas; I-05 (ALTO) maneja credenciales de la base. Hoy no hay ninguna regla raíz que lo diga (solo `backend/AGENTS.md`, que no cubre el frontend ni la evidencia).

### D2 — Resto de `CLAUDE.md`/`AGENTS.md`

- Título: «Integrador_Prog3 (Global) — Instrucciones para Agentes»; línea de descripción: librería web (catálogo, altas, ventas e historial) con frontend nativo que consume la API FastAPI + PostgreSQL vía Nginx, desplegada en Easypanel.
- Tabla **Stack**: Estructura/Estilos/Comportamiento (rutas bajo `frontend/public/`), Servidor web (Nginx `nginx:1.30-alpine`, sirve `public/` y hace proxy `/api/` → backend quitando el prefijo), Backend (FastAPI + SQLModel + Alembic, Python 3.12, ver `backend/AGENTS.md`), Persistencia (PostgreSQL 16 vía la API; navegador: solo borrador de venta en memoria), Despliegue (Docker + Easypanel, HTTPS, backend sin dominio público). Línea «Prohibido» acotada al frontend. Enlace de detalle a `knowledge-base/02` y a `docs/consignas/Consignas Global.pdf`.
- **Base de Conocimiento**: misma tabla; la nota de preguntas abiertas pasa a remitir a `10` actualizado y a los changes I-xx que las resuelven.
- **Skills**: Agente B pasa a «JavaScript + integración con la API»; `fastapi-python` y `python-testing-patterns` se mueven de «No aplican» a «solo si un change toca `backend/`»; siguen sin aplicar `supabase-postgres-best-practices`, `auth-implementation-patterns` y `tdd` (frontend sin runner).
- **Roadmap**: 7 changes (I-00..I-06) en 4 fases; camino crítico `I-00 → I-01 → I-02 → I-03 → I-04 → I-06` (I-05 en paralelo, listo antes de I-06); primer change `I-00` (`reglas-global`). Mención breve de que C-01..C-06 son antecedente archivado.
- **Flujo de Trabajo**: paso 1 incluye la consigna del Global y los routers/schemas del backend; paso 5 «Verificar manualmente servido por Nginx (`http://127.0.0.1:8080`, nunca abriendo el HTML como archivo) + W3C».
- Se agrega una línea: `backend/` tiene sus propias reglas en `backend/AGENTS.md`; ante cambios en `backend/` rigen ambas, y en conflicto sobre `backend/` gana `backend/AGENTS.md`.

Alternativa descartada: hacer que `CLAUDE.md` sea `@AGENTS.md` (como en `backend/`). Reduciría duplicación, pero el encabezado actual exige mantener «copia» idéntica y otras herramientas leen `AGENTS.md`; cambiar la convención excede I-00.

### D3 — KB: reescribir lo que contradice, marcar el resto como antecedente

- **Reescribir** (afirmaciones que un agente usaría para decidir): `02` (stack, arquitectura con Nginx/proxy, integraciones = API propia, verificación manual del frontend + `pytest` del backend, entrega según p. 9), `04` §Persistencia (PostgreSQL vía API; seed con `python -m scripts.seed`) más una nota en §Entidades de que el contrato vigente son los schemas del backend (`stock`, autorías `{autor_id, rol, orden}`, cliente `nombre`), `08` (estructura `frontend/` + `backend/`, patrón cliente HTTP centralizado, seguridad: `textContent` + secretos fuera del repo, variables `API_UPSTREAM` y `DATABASE_URL`), `09` (D-02 y D-03 marcadas «Reemplazada en el Global por …»; nuevas decisiones D-G01..D-G05), `10` (preguntas 2–4 del parcial marcadas como resueltas/obsoletas; nuevas preguntas del Global).
- **Marcar como antecedente** (bloque de nota al inicio, sin reescribir): `01`, `03`, `06`, `07`, `knowledge-base/README.md` (este último además agrega la consigna del Global como fuente).
- Rationale: rehacer toda la KB con `kb-creator` duplicaría el trabajo de CHANGES.md y de las delta specs de I-02..I-04; marcar como antecedente evita información contradictoria con el menor diff. Alternativa descartada: mover la KB del parcial a `docs/antecedentes/` y regenerarla — rompería los enlaces de `CLAUDE.md`, de las specs archivadas y de `CHANGES.md`.

Decisiones nuevas a registrar en `09`:
- **D-G01** Registros e importes confirmados en PostgreSQL vía la API; el navegador solo guarda en memoria el borrador de venta.
- **D-G02** Todo `fetch` usa la base relativa `/api` + ruta exacta con barra final; Nginx quita el prefijo (`proxy_pass http://${API_UPSTREAM}/;`).
- **D-G03** Verificación: manual (G-01..G-07 + W3C) en el frontend; `pytest` en el backend.
- **D-G04** Selectores de autores y clientes: ver D4.
- **D-G05** Sin secretos en el repo ni en la evidencia; solo nombres de variables.

### D4 — Selectores de autores y clientes: listado + consulta por ID donde la consigna lo pide

> **Checkpoint 1.2: resuelto por el grupo el 2026-11-10 — se elige el listado paginado.** La consulta por ID no es el enfoque elegido para los selectores.

**Decisión**: los `<select>` de autores (alta de libro, I-03) y de clientes (venta, I-04) se cargan desde los **listados** `GET /autores/` y `GET /clientes/`, pidiendo páginas de `limit=100` y avanzando `offset` hasta recibir menos de 100 elementos. La consulta individual se usa donde la consigna o los casos la exigen: `GET /clientes/{id}` para «recuperar el cliente por ID» (G-03) y `GET /libros/{id}` para el detalle. Se documenta en `09` (D-G04) y, al cierre, en el README (I-06).

Rationale:
- El backend expone ambos; la consigna permite usar listados si existen y solo exige documentar la elección (recuadro «Consultas por ID», p. 2).
- Con listado el operador elige por nombre: no puede tipear un ID inexistente, así que el 409 por FK inexistente queda para el caso negativo deliberado de G-06 (que se prueba con un cuerpo armado a mano o un ID tipeado en la verificación), y el borrador de venta no se ensucia con IDs inválidos.
- Menos peticiones por interacción (una o pocas páginas al abrir la vista contra un `GET /{id}` por cada autor agregado).

Alternativa considerada: consulta por ID (`GET /autores/{id}` / `GET /clientes/{id}`) con campo numérico + botón «Verificar» que muestra el nombre. Ventaja: es el camino que describe la consigna como base y escala a cualquier tamaño de tabla. Desventaja: el operador necesita conocer los IDs y la UX es peor. Queda descartada como enfoque de los selectores; solo sería un fallback si la cantidad de registros hiciera inviable el listado.

Límite conocido: los listados no filtran por nombre y tienen tope `limit=100` por página; con datos ficticios del seed el volumen es mínimo, y el paginado por `offset` cubre más de 100.

### D5 — Sin delta specs en I-00 (`skip_specs: true`)

Las specs describen comportamiento observable. I-00 no cambia código: hoy la aplicación sigue usando `localStorage`, y las specs `datos-locales` («Datos locales sin red ni persistencia», «Identificador de los registros dados de alta») y `venta-simulada` describen ese comportamiento con exactitud. Modificarlas ahora dejaría specs que el código no cumple durante I-01..I-04. Cada delta se escribe junto al código que cambia el comportamiento, como ya prevé `CHANGES.md` («I-02..I-04 deben modificarlas»). Las reglas duras son contrato del proceso de desarrollo, no del sistema, y viven en `CLAUDE.md`/`AGENTS.md`. Alternativa descartada: crear una capability `reglas-proyecto` — no describe comportamiento del sistema y duplicaría `CLAUDE.md`.

### D6 — Brechas de contrato conocidas (se registran, no se implementan)

Se anotan en `10` (sección «Brechas de contrato para I-03/I-04») para que los changes siguientes no las redescubran:
- El formulario de clientes envía `nombreCompleto`; `ClienteCreate` espera `nombre` y rechaza campos extra (`extra="forbid"`) → 422. Lo resuelve I-03.
- `LibroCreate.autores` acepta lista vacía, pero la consigna exige al menos un autor → la validación vive en el frontend (I-03). No se cambia el backend.
- El parcial modelaba `autorIds` y no tenía `stock`; el contrato exige autorías `{autor_id, rol, orden}` con rol en {autor, coautor, traductor, ilustrador} y `stock` entero ≥ 0 (I-03).

## Risks / Trade-offs

- [El grupo no acepta la redacción de alguna regla, en especial la nueva regla 6 o el «ni calcularlos» de la 4] → checkpoint 1.x en `tasks.md`: no se escribe hasta tener el OK; cualquier ajuste se refleja primero en este `design.md`.
- [`CLAUDE.md` y `AGENTS.md` divergen al editarlos] → editar uno y copiarlo al otro; verificar con `diff` (vacío) como tarea explícita.
- [La KB queda con secciones mixtas parcial/Global] → nota de antecedente uniforme al inicio de cada archivo no reescrito y `grep` final de `localStorage`/«sin backend»/«Ninguno» que solo debe aparecer en contexto de antecedente.
- [El listado de selectores supera 100 registros] → paginar con `offset`; si el grupo prefiere evitarlo, aplicar el fallback por ID de D4.
- [Un agente lee la regla 1 acotada como permiso para agregar tests al frontend en otro directorio] → la regla nombra explícitamente `frontend/` y el override de Strict TDD.

## Migration Plan

1. Confirmar con el grupo la redacción de D1 y la decisión D4.
2. Editar `CLAUDE.md`, copiar a `AGENTS.md`, verificar `diff`.
3. Editar la KB según D3.
4. Verificación manual (diff, greps, enlaces).
5. Rollback: `git checkout -- CLAUDE.md AGENTS.md knowledge-base/` (sin commit no hay nada más que revertir).

## Open Questions

- ~~¿El grupo prefiere el fallback por ID de D4?~~ Resuelta el 2026-11-10: el grupo eligió el listado paginado (D4); D-G04 en `09` lo refleja.
- Integrantes del grupo para el README: no afecta a I-00; se completa en I-06.
