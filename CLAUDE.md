# Integrador_Prog3 (Global) — Instrucciones para Agentes

> Este archivo (y su copia `AGENTS.md`) es lo PRIMERO que todo agente lee al entrar al repo.
> Generado a partir de `knowledge-base/` y `CHANGES.md`. No editar a mano sin re-sincronizar ambos archivos (deben quedar idénticos).

Librería web (TPI Programación III, Global): catálogo, altas de libros y clientes, ventas e historial, con un frontend nativo que consume la API FastAPI + PostgreSQL a través de Nginx, desplegada en Easypanel.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Estructura | HTML5 semántico (`frontend/public/`) | — |
| Estilos | CSS3 (Flexbox/Grid), archivos externos en `frontend/public/css/` | — |
| Comportamiento | JavaScript nativo (ES modules opcional), en `frontend/public/js/` | — |
| Servidor web | Nginx (`nginx:1.30-alpine`): sirve `public/` y hace proxy `/api/` → backend quitando el prefijo | 1.30 |
| Backend | FastAPI + SQLModel + Alembic (ver `backend/AGENTS.md`) | Python 3.12 |
| Persistencia | PostgreSQL vía la API; en el navegador solo el borrador de venta, en memoria | 16 |
| Despliegue | Docker + Easypanel, HTTPS, backend sin dominio público | — |

Prohibido en el frontend: librerías, frameworks, CDNs de CSS/JS, npm, build tools. Recursos siempre locales.
Detalle completo: [knowledge-base/02_descripcion_general.md](knowledge-base/02_descripcion_general.md) y `docs/consignas/Consignas Global.pdf`.

`backend/` tiene sus propias reglas en [backend/AGENTS.md](backend/AGENTS.md): ante cambios en `backend/` rigen ambos archivos y, en conflicto sobre `backend/`, gana `backend/AGENTS.md`.

---

## Base de Conocimiento

La fuente de verdad del dominio vive en `knowledge-base/` (índice: [README.md](knowledge-base/README.md)). **Leé el archivo relevante ANTES de implementar.** Los archivos `01`, `03`, `06` y `07` describen el parcial y están marcados como antecedente; para el Global rigen la consigna y [CHANGES.md](CHANGES.md).

| Archivo | Cuándo leerlo |
|---------|---------------|
| [01_vision_y_objetivos.md](knowledge-base/01_vision_y_objetivos.md) | Propósito y alcance (antecedente del parcial) |
| [02_descripcion_general.md](knowledge-base/02_descripcion_general.md) | Stack, arquitectura con Nginx, verificación |
| [03_actores_y_roles.md](knowledge-base/03_actores_y_roles.md) | Operador único, sin auth (antecedente del parcial) |
| [04_modelo_de_datos.md](knowledge-base/04_modelo_de_datos.md) | Entidades, seed, persistencia en la API |
| [05_reglas_de_negocio.md](knowledge-base/05_reglas_de_negocio.md) | Reglas RN-01..RN-24 |
| [06_funcionalidades.md](knowledge-base/06_funcionalidades.md) | Épicas por ejercicio (antecedente del parcial) |
| [07_flujos_principales.md](knowledge-base/07_flujos_principales.md) | Flujos y casos manuales (antecedente del parcial) |
| [08_arquitectura_propuesta.md](knowledge-base/08_arquitectura_propuesta.md) | Estructura, patrones, seguridad |
| [09_decisiones_y_supuestos.md](knowledge-base/09_decisiones_y_supuestos.md) | Decisiones tomadas (D-G01..D-G05 del Global) |
| [10_preguntas_abiertas.md](knowledge-base/10_preguntas_abiertas.md) | Dudas y brechas de contrato para I-03/I-04 |

> Preguntas abiertas: `10` indica cuáles resolvió el Global y qué change (I-xx) cierra cada brecha de contrato. Revisalo antes de tocar altas (I-03) o ventas (I-04).

---

## Skills Disponibles

Fuente: `.atl/skill-registry.md`. Ninguna skill de stack aplica al frontend (HTML/CSS/JS nativo); solo skills de flujo y, para `backend/`, las de Python.

| Agente | Rol | Skills que carga |
|--------|-----|------------------|
| **HTML/CSS** (Agente A) | Estructura, presentación, imagen Nginx, despliegue, docs | — (sin skill de stack; seguir reglas duras y KB) |
| **JavaScript + API** (Agente B) | Cliente HTTP, validaciones, ventas, integración con la API | — (sin skill de stack; seguir reglas duras y KB) |
| **Orquestación** | KB, roadmap, reglas del proyecto, registry | `kb-creator`, `roadmap-generator`, `agent-instruction`, `skill-creator`, `find-skill` |
| **Discovery** | Investigación previa a la KB | `discovery-research`, `web-scraper` |

Solo si un change toca `backend/`: `fastapi-python` y `python-testing-patterns`.
No aplican (instaladas pero fuera de alcance): `supabase-postgres-best-practices`, `auth-implementation-patterns`, `tdd` (el frontend no tiene runner).

> Los compact rules de cada skill los resuelve el orquestador desde `.atl/skill-registry.md` (generado por `skill-registry`; no versionado — no está en el repo). Esta tabla solo mapea skill→rol.

---

## Roadmap de Changes

El plan completo está en [CHANGES.md](CHANGES.md). Resumen:

- **Total**: 7 changes (I-00..I-06) en 4 fases (Preparación; Imagen del frontend; Integración JavaScript con la API; Despliegue y entrega).
- **Camino crítico** (6): `I-00 → I-01 → I-02 → I-03 → I-04 → I-06` (I-05 corre en paralelo y debe estar listo antes de I-06).
- **Primer change**: `I-00` (`reglas-global`).
- Los changes C-01..C-06 del primer parcial son antecedente archivado (sus specs viven en `openspec/specs/`).

**Antes de cualquier `/opsx:propose`**: leé [CHANGES.md](CHANGES.md), identificá las dependencias del change y los archivos de "Leer antes".

---

## Reglas Duras (específicas del proyecto)

> Reglas globales ya definidas en `~/.claude/CLAUDE.md` (orquestador, governance, engram): el proyecto las hereda, excepto Strict TDD, que no aplica al frontend — ver regla 1. Acá viven solo las reglas **específicas de este proyecto**. Son contrato; romperlas es un defecto.

1. **NUNCA instalar Jest/Vitest/Playwright ni crear archivos de test en `frontend/`** → el frontend no tiene suite de tests ni test runners; el módulo Strict TDD del global NO aplica al frontend (override explícito). Verificar a mano los casos G-01..G-07 de la consigna registrando el resultado real y su evidencia, y validar el HTML en el W3C validator. El backend conserva su suite `pytest` (`backend/tests/`) y sus casos `.http` (`backend/test/`): si un change toca `backend/`, rige `backend/AGENTS.md` y `pytest` debe seguir pasando.
2. **NUNCA usar frameworks, librerías, CDNs, npm, `package.json` ni herramientas de build en el frontend** → solo HTML, CSS y JavaScript nativos, con todos los recursos locales en `frontend/public/`. La imagen oficial de Nginx (`frontend/Dockerfile`) sirve esos archivos tal cual; no es un paso de build. Las dependencias del backend viven solo en `backend/requirements*.txt`.
3. **NUNCA usar CSS inline ni `<style>` embebido para la identidad visual** → CSS en archivos externos en `frontend/public/css/`, reutilizando clases.
4. **NUNCA guardar en el navegador registros ni importes confirmados, ni calcularlos por cuenta propia** → libros, clientes, ventas e importes vienen de la API (FastAPI + PostgreSQL) con `fetch` a la base relativa `/api` más la ruta exacta del backend con su barra final (`/api/libros/`); nunca la URL ni el puerto del backend en el JS. El navegador solo mantiene **en memoria** el borrador de la venta (sin `localStorage`). Usar datos ficticios.
5. **NUNCA insertar como HTML (`innerHTML`) datos escritos por usuarios ni datos que vuelven de la API** → insertarlos como texto en el DOM con `textContent`.
6. **NUNCA versionar `.env`, credenciales ni valores reales de despliegue** → solo nombres de variables en archivos de ejemplo (`backend/env.example`); ocultar contraseñas y valores privados en las capturas de `evidencia/`.

---

## Flujo de Trabajo

```
1. Leer la KB relevante (knowledge-base/), la consigna del Global y los routers/schemas del backend → entender el dominio y el contrato
2. Identificar el change en CHANGES.md           → respetar dependencias
3. /opsx:propose <nombre-del-change>             → proposal + design + specs + tasks
4. /opsx:apply <nombre-del-change>               → implementar respetando las reglas duras
5. Verificar manualmente servido por Nginx (http://127.0.0.1:8080, nunca abriendo el HTML como archivo) + W3C → casos G-01..G-07
6. /opsx:archive <nombre-del-change> + marcar [x] en CHANGES.md
```

OPSX se entrega como **comandos** en `.claude/commands/opsx/*.md` (`propose`, `apply`, `archive`, `explore`, `sync`, `update`); no existen skills `openspec-*`. Los sub-agentes deben leer el archivo de comando correspondiente y seguirlo.

Aplicar TODAS las reglas duras en cada paso. Ante conflicto entre la KB y este archivo, las reglas duras prevalecen.
