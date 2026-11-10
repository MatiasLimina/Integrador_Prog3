# Proposal

## Why

Las reglas del proyecto (`CLAUDE.md`/`AGENTS.md`) y la `knowledge-base/` todavía describen el primer parcial: frontend 100 % en el navegador, persistencia en `localStorage` y la regla dura 4 «NUNCA depender de backend, API, BD ni login real». El Global (`docs/consignas/Consignas Global.pdf`, p. 1) exige lo contrario: los registros y los importes confirmados provienen de la API FastAPI + PostgreSQL y el navegador solo puede mantener en memoria el borrador de una venta. Mientras esas reglas sigan vigentes, cualquier agente que implemente I-01..I-06 estaría obligado a violar una regla dura o a ignorarla; por eso I-00 va primero en el camino crítico.

## What Changes

- **BREAKING (regla de proyecto)**: se reemplaza la regla dura 4 («sin backend / `localStorage`») por una regla que obliga a obtener registros e importes confirmados de la API vía la base relativa `/api` + la ruta exacta del backend con su barra final, y que limita el estado del navegador al borrador de venta en memoria.
- Se acota la regla dura 1 (sin test runners ni archivos de test) al **frontend**; el backend conserva su suite `pytest` (`backend/tests/`) y sus casos `.http` (`backend/test/`).
- Se acota la regla dura 2 (sin frameworks/CDN/npm/build) al frontend y se aclara que la imagen oficial de Nginx que sirve `frontend/public/` no es una herramienta de build.
- Se mantienen las reglas de CSS externo (3) y de `textContent` (5), esta última extendida explícitamente a los datos que vuelven de la API.
- Se agrega una regla dura nueva (6) sobre secretos: nunca versionar `.env`, credenciales ni valores reales de despliegue; ocultarlos en la evidencia (consigna p. 9).
- Se actualizan en `CLAUDE.md` y `AGENTS.md` (idénticos): título y descripción del proyecto, tabla de Stack (Nginx, FastAPI, PostgreSQL, Docker/Easypanel), tabla de skills (las de backend aplican solo a `backend/`), resumen del roadmap (I-00..I-06, primer change I-00) y flujo de trabajo (verificación servida por Nginx).
- Se actualiza la `knowledge-base/`: se reescriben las secciones que contradicen el Global en `02`, `04` §Persistencia, `08`, `09` y `10`; `01`, `03`, `06`, `07` y el `README.md` de la KB reciben una nota de «antecedente del parcial» que remite a la consigna del Global y a `CHANGES.md`.
- Se registra la decisión de selectores de autores y clientes (listados `GET /autores/` y `GET /clientes/` frente a consulta por ID), que la consigna pide documentar, y las brechas de contrato conocidas para I-03.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

_Ninguna._ Este change solo modifica reglas de proyecto y documentación; no cambia el comportamiento observable de la aplicación. Las specs `datos-locales` y `venta-simulada` siguen describiendo correctamente el código actual (que usa `localStorage`) y se modifican con delta specs en I-02..I-04, junto con el código que cambia ese comportamiento (ver `design.md`). El change declara `skip_specs: true` en `.openspec.yaml`.

## Impact

- **Archivos modificados en apply**: `CLAUDE.md`, `AGENTS.md`, `knowledge-base/README.md`, `knowledge-base/01_vision_y_objetivos.md`, `02_descripcion_general.md`, `03_actores_y_roles.md`, `04_modelo_de_datos.md`, `06_funcionalidades.md`, `07_flujos_principales.md`, `08_arquitectura_propuesta.md`, `09_decisiones_y_supuestos.md`, `10_preguntas_abiertas.md`.
- **Sin cambios**: código de `frontend/` y `backend/`, `backend/CLAUDE.md`/`backend/AGENTS.md` (ya rigen solo el backend y no contradicen el Global), `openspec/specs/`, `README.md`, `DEPLOY.md` (los toman I-01, I-05 e I-06).
- **Agentes**: a partir de I-01 todo agente lee las reglas nuevas; I-02..I-04 dejan de estar en conflicto con la regla dura 4.
- **Governance**: MEDIO — cambia reglas duras; el grupo confirma la redacción antes de escribir.
