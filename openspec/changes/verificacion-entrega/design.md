# Design

## Context

Ver `proposal.md` (Why). Estado relevado:

- Desplegado: commit `3a2c55d` en `backend` y `frontend` de Easypanel (proyecto `gordos_programacion`). `HEAD` de `main` (`8dd4865`) solo agrega, respecto de esa revisión, `backend/.dockerignore`, `backend/env.example` y `frontend/env.example`: ninguno cambia el comportamiento de las imágenes, pero la consigna pide verificar la versión final, así que se redespliega.
- `frontend/public/*.html` no cambió desde `3064724` (I-04). `ventas.html` e `historial.html` tienen captura W3C de I-04; `libros.html` y `clientes.html`, de I-03. `index.html` cambió en I-03 después de validarse en I-02 y no tiene captura.
- `evidencia/` tiene capturas `I-01..I-05`: las de G-01..G-06 se tomaron en local; las públicas de I-05 son de la revisión `3a2c55d`.
- Base de producción con el seed (libros 1..4, clientes 1..2, venta 1) y el cliente de prueba ID 3 de I-05. El seed vacía las tablas: no se vuelve a correr.
- `README.md` ya identifica al grupo y documenta ejecución local y `python -m scripts.seed`. `backend/.env` existe en disco (sin versionar); `*.zip` está en `.gitignore`.

## Goals / Non-Goals

**Goals:**
- Cada caso G queda registrado con pasos, resultado observado y evidencia de la URL pública sobre la revisión final.
- El ZIP sale de un commit concreto y es reproducible con un comando.

**Non-Goals:**
- Corregir defectos encontrados (se registran y se abre un change aparte).
- Automatizar la verificación (regla dura 1: sin runners en el frontend).

## Decisions

1. **Sin delta specs (`skip_specs: true`)**. No cambia comportamiento; los criterios de cada caso G ya están en las specs vigentes. *Alternativa*: una capability `entrega` con requisitos sobre README y ZIP — descartada: describe un entregable, no al sistema, e inventaría requisitos para pasar la validación.

2. **Orden: redesplegar → G-07 (build/HTTPS/salud) → G-01..G-06 → redespliegue del backend → G-07 (persistencia) → documentar → ZIP.** El primer redespliegue publica la revisión final antes de cualquier caso. La persistencia se prueba con datos creados durante la verificación (libro de G-02, cliente de G-03, venta de G-04), no solo con los de I-05, porque es más convincente y cuesta un clic. Los commits posteriores son solo de documentación y evidencia: no requieren otro redespliegue y `DEPLOY.md` aclara que `frontend/` y `backend/` del ZIP son idénticos a la revisión desplegada.

3. **Datos encadenados**. G-04 vende el libro creado en G-02 (con stock suficiente) al cliente creado en G-03, más un libro del seed; G-05 cambia con `PATCH` el precio del libro de G-02. Así los casos demuestran la integración de punta a punta y no se alteran precios del seed. Cómo provocar G-06 (opción con `value="999"` y `Api.pedir` desde la consola) es lo relevado en I-04 (`knowledge-base/10`, brechas de I-04).

4. **Registro en `README.md`**, sección «Verificación (G-01 a G-07)», con una fila por caso (Caso | Pasos | Resultado observado | Evidencia). La consigna admite «README o carpeta evidencia/»; el README es lo primero que lee quien corrige y ya anuncia que `evidencia/` contiene los casos. `DEPLOY.md` remite a esa tabla en lugar de duplicarla. *Alternativa*: `evidencia/VERIFICACION.md` — válida si el grupo prefiere un README más corto; solo cambia dónde se escribe la tabla.

5. **Evidencia nueva con prefijo `G-0X-`** (p. ej. `G-04-venta-201.png`, `G-04-detalle-recarga.png`). Las capturas `I-0X-*` quedan como evidencia de desarrollo y no se presentan como casos G (se tomaron en local o sobre otra revisión). Se reutilizan solo las capturas W3C de I-03/I-04, porque el HTML que validaron es idéntico al desplegado (se comprueba con `git diff 3064724 HEAD -- frontend/public` vacío).

6. **W3C por dirección**: `https://validator.w3.org/nu/?doc=https%3A%2F%2Flibreria.matiaslimina.me%2F` valida lo que realmente sirve Nginx. Obligatorio para `index.html`; las otras cuatro, opcional (mismo enlace con `libros.html`, `clientes.html`, `ventas.html`, `historial.html`).

7. **ZIP con `git archive`** desde `HEAD` limitado a `frontend backend README.md DEPLOY.md evidencia`. Solo incluye archivos versionados, así que deja afuera `backend/.env`, `.venv`, `__pycache__`, `.pytest_cache` y `node_modules` sin listas de exclusión manuales, y es reproducible desde el commit. *Alternativa*: `Compress-Archive` sobre las carpetas — descartada: copiaría el `.env` local y cachés. Requisito: la evidencia y la documentación deben estar commiteadas antes de generar el ZIP. Se genera fuera del repo (`..\`) para no depender del `.gitignore`.

8. **Enlaces a `docs/`**. El ZIP no incluye `docs/`; los dos enlaces (`README.md` §Estructura y `DEPLOY.md` encabezado) se dejan como referencia en texto «(en el repositorio)» para que no queden rotos en la entrega.

## Risks / Trade-offs

- [Un caso G falla en producción] → se registra el resultado real (nunca «pasó» sin ejecutarlo), se diagnostica con la tabla de `DEPLOY.md` y se abre un change de corrección; I-06 no se archiva con un caso en falso.
- [Captura con secretos] → revisión de cada archivo antes de `git add`; ante una filtración no se versiona y se rota la clave.
- [Redespliegue que rompe el servicio] → la configuración no cambia; si falla, «Pasos de actualización» y «Diagnóstico» de `DEPLOY.md`; Easypanel permite volver a desplegar el commit anterior.
- [Datos de prueba en producción] → solo datos ficticios (`@example.com`, ISBN inventado); se aceptan como parte de la demo.
- [El ZIP no refleja el último commit] → se genera después del último commit y se lista su contenido antes de entregarlo.

## Migration Plan

Sin migraciones de esquema (no cambia `backend/migrations/`). Redespliegue: «Pasos de actualización» de `DEPLOY.md`, sin seed. Rollback: Deploy del commit anterior en Easypanel.
