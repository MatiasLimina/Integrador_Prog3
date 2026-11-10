# Tasks

> Governance MEDIO: el grupo 1 es un checkpoint bloqueante. No se escribe en `CLAUDE.md`, `AGENTS.md` ni `knowledge-base/` hasta cerrarlo.
> Sin test runner para documentación: cada tarea se verifica a mano con el comando o la comprobación indicada (comandos en PowerShell para correr en la terminal del grupo).

## 1. Checkpoint del grupo (bloqueante)

- [x] 1.1 Presentar al grupo la redacción verbatim de las reglas duras 1–6 (`design.md` §D1) y obtener el OK explícito; verificar: la respuesta del grupo queda registrada (en el chat o como comentario del change) y cualquier ajuste se copia primero a `design.md` §D1.
- [x] 1.2 Confirmar la decisión de selectores (`design.md` §D4: listado `GET /autores/` y `GET /clientes/` con paginado, o fallback por ID); verificar: la opción elegida queda escrita en `design.md` §D4 y en la «Open Question» correspondiente (resuelta o eliminada).

## 2. CLAUDE.md y AGENTS.md

- [x] 2.1 Reescribir en `CLAUDE.md` la sección «Reglas Duras» con el texto aprobado en 1.1 (incluido el párrafo introductorio: override de Strict TDD solo para el frontend; `backend/` se rige por `backend/AGENTS.md`); verificar: `Select-String -Path CLAUDE.md -Pattern "NUNCA depender de backend"` no devuelve nada y la sección tiene exactamente las reglas 1–6.
- [x] 2.2 Actualizar en `CLAUDE.md` título, descripción y tabla «Stack» según `design.md` §D2 (Nginx, FastAPI/SQLModel/Alembic, PostgreSQL vía API, borrador de venta en memoria, Docker + Easypanel); verificar: `Select-String -Path CLAUDE.md -Pattern "Parcial_Front","100 % en el navegador","\| Ninguno"` no devuelve nada.
- [x] 2.3 Actualizar en `CLAUDE.md` las secciones «Base de Conocimiento» (nota de preguntas abiertas → `10` actualizado e I-xx), «Skills Disponibles» (`fastapi-python` y `python-testing-patterns` solo para `backend/`), «Roadmap de Changes» (I-00..I-06, camino crítico, primer change I-00, C-01..C-06 como antecedente) y «Flujo de Trabajo» (verificar servido por Nginx en `http://127.0.0.1:8080` + W3C); verificar: `Select-String -Path CLAUDE.md -Pattern "C-0[1-6]"` solo aparece en la mención de antecedente.
- [x] 2.4 Copiar `CLAUDE.md` a `AGENTS.md`; verificar: `git diff --no-index --stat CLAUDE.md AGENTS.md` no muestra diferencias (o `diff CLAUDE.md AGENTS.md` vacío en Git Bash).
- [x] 2.5 Revisar que todos los enlaces relativos de `CLAUDE.md` existan (`knowledge-base/*.md`, `CHANGES.md`, `backend/AGENTS.md`, `docs/consignas/Consignas Global.pdf`); verificar: `Test-Path` devuelve `True` para cada destino enlazado.

## 3. Knowledge base

- [x] 3.1 Reescribir `knowledge-base/02_descripcion_general.md` (stack, arquitectura con Nginx y proxy `/api/`, integraciones = API propia, verificación manual del frontend + `pytest` del backend, entrega según consigna p. 9); verificar: `Select-String -Path knowledge-base/02_descripcion_general.md -Pattern "localStorage","Ninguna","100 % cliente"` solo aparece, si aparece, en una frase marcada como antecedente.
- [x] 3.2 Actualizar `knowledge-base/04_modelo_de_datos.md`: §Persistencia (PostgreSQL vía API; seed con `python -m scripts.seed`), §Seed data y una nota en §Entidades que remita a los schemas del backend (`stock`, autorías `{autor_id, rol, orden}`, cliente `nombre`); verificar: §Persistencia no menciona `localStorage` salvo como antecedente.
- [x] 3.3 Reescribir `knowledge-base/08_arquitectura_propuesta.md` (estructura `frontend/` + `backend/`, cliente HTTP centralizado, seguridad con `textContent` y secretos fuera del repo, variables `API_UPSTREAM` y `DATABASE_URL`); verificar: ya no dicen «sin servidor» ni «Variables de entorno / build: No aplica».
- [x] 3.4 Actualizar `knowledge-base/09_decisiones_y_supuestos.md`: marcar D-02 y D-03 como «Reemplazada en el Global por …», marcar como antecedente el supuesto de ids de venta locales y agregar D-G01..D-G05 (`design.md` §D3, con D-G04 = decisión confirmada en 1.2); verificar: D-G04 coincide textualmente con la opción elegida en `design.md` §D4.
- [x] 3.5 Actualizar `knowledge-base/10_preguntas_abiertas.md`: marcar las preguntas 2–4 del parcial como resueltas/obsoletas por el Global y agregar la sección «Brechas de contrato para I-03/I-04» (`design.md` §D6); verificar: la sección nombra `nombreCompleto` → `nombre` (422 por `extra="forbid"`) y `autores=[]`.
- [x] 3.6 Agregar una nota de antecedente uniforme al inicio de `knowledge-base/01_vision_y_objetivos.md`, `03_actores_y_roles.md`, `06_funcionalidades.md` y `07_flujos_principales.md`, y actualizar `knowledge-base/README.md` (fuente: consigna del Global + `CHANGES.md`; la descripción deja de decir «sin backend»); verificar: cada archivo empieza con la nota y la nota enlaza a `../CHANGES.md`.

## 4. Verificación integral

- [x] 4.1 Barrido de restos: `Select-String -Path CLAUDE.md,AGENTS.md,knowledge-base/*.md -Pattern "localStorage","sin backend","no hay backend","Backend / Integraciones","Ninguno"`; verificar: cada coincidencia restante está en contexto de antecedente o de regla («sin `localStorage`»), ninguna como regla o stack vigente.
- [x] 4.2 Confirmar que no se tocó nada fuera del alcance; verificar: `git status --short` solo lista `CLAUDE.md`, `AGENTS.md`, `knowledge-base/*.md` y `openspec/changes/reglas-global/` (sin `frontend/`, `backend/`, `openspec/specs/`, `README.md` ni `DEPLOY.md`).
- [x] 4.3 Releer `CLAUDE.md` contra `CHANGES.md` §I-01..I-06 buscando contradicciones (por ejemplo, una regla que impida el `Dockerfile` de I-01 o el `fetch` de I-02); verificar: lista de contradicciones vacía, registrada en el resumen del apply.

## Workflow follow-up

- Marcar `[x]` en `CHANGES.md` §[I-00] (Estado) y en la tabla «Plan» si corresponde.
- Commit sugerido: `docs(reglas): adaptar reglas duras y KB al Global (I-00)`.
- `/opsx:archive reglas-global` (sin delta specs: `skip_specs: true`).
