# Proposal

## Why

La consigna del Global (p. 9, «Verificación y entrega») puntúa «el funcionamiento observado y su reproducción con la entrega»: hay que ejecutar los casos G-01..G-07 **desde la URL pública** con datos ficticios, registrar pasos, resultado observado y evidencia, y entregar un ZIP por grupo. I-01..I-05 dejaron la app integrada y desplegada (commit `3a2c55d`), pero la evidencia de G-01..G-06 que existe se tomó en local (`127.0.0.1:8080`) durante I-02..I-04, `DEPLOY.md` tiene «Casos G-01 a G-07» como _Pendiente_, el `README.md` no documenta la decisión de selectores ni una demo, y el ZIP no existe. I-06 cierra el camino crítico y deja la entrega lista.

## What Changes

**Lo hace una persona del grupo** (requiere Easypanel, navegador y validador; el agente no tiene acceso):
- Redesplegar la versión final de `main` (backend y frontend) y comprobar build de la imagen del frontend, HTTPS y `/api/health/ready` → 200.
- Ejecutar G-01..G-06 en `https://libreria.matiaslimina.me` con datos ficticios, anotando el resultado real de cada paso; después redesplegar el backend y comprobar que los datos creados siguen (G-07).
- Capturas `evidencia/G-0X-*.png` (barra de direcciones visible; sin contraseñas, `DATABASE_URL` ni IP).
- Validar en el W3C Nu HTML Checker, por dirección pública, `index.html` (cambió en I-03 después de su última validación y no tiene captura) y revalidar las otras cuatro vistas o reutilizar sus capturas de I-03/I-04 (su HTML no cambió desde `3064724`).
- Demo mínima: catálogo, venta con dos renglones, reabrir el detalle tras recargar, importes iguales a los de la API.

**Lo hace el agente** (repositorio):
- `README.md`: secciones «Decisión de selectores» (D-G04: listados `GET /autores/` y `GET /clientes/` paginados; consulta por ID solo para recuperar cliente y detalle de libro), «Verificación (G-01 a G-07)» con tabla Caso | Pasos | Resultado observado | Evidencia, «Demo» y «Entrega (ZIP)»; el grupo ya está identificado y la ejecución local y la carga de datos ya están documentadas (se revisan, no se reescriben).
- `DEPLOY.md`: revisión y fecha del redespliegue final; la sección «Casos G-01 a G-07» remite a la tabla del README; aviso de mantener la URL operativa durante la corrección.
- Enlaces de `README.md`/`DEPLOY.md` que apuntan a `docs/` (fuera del ZIP) pasan a referencias en texto.
- `knowledge-base/10_preguntas_abiertas.md`: cerrar «Integrantes del grupo» (ya están en el README) y «Aviso de maqueta» (el requisito ya no existe en `openspec/specs/navegacion-vistas`).
- Comando (PowerShell, una línea) que arma el ZIP con `git archive` desde el commit final —`frontend/`, `backend/`, `README.md`, `DEPLOY.md`, `evidencia/`— y comprobación de que no contiene `.env`, credenciales ni dependencias instaladas.

**Fuera de alcance**: cambios de comportamiento en `frontend/` o `backend/` (si un caso G falla se registra el fallo y se abre un change aparte), nueva carga inicial (el seed **no** se vuelve a correr en Easypanel), CSS validator.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

_Ninguna._ El change verifica el sistema desplegado y produce documentación y el paquete de entrega; no cambia el comportamiento observable de la aplicación. Los requisitos que se comprueban ya viven en las specs (`catalogo-libros`, `registro-libros`, `registro-clientes`, `venta-simulada`, `historial-ventas`, `servidor-frontend`, `despliegue`). Por eso declara `skip_specs: true` en `.openspec.yaml`, igual que `reglas-global` (I-00).

## Impact

- **Archivos modificados en apply**: `README.md`, `DEPLOY.md`, `knowledge-base/10_preguntas_abiertas.md`; nuevos `evidencia/G-0*.png` (y `evidencia/G-W3C-*.png` si se revalida).
- **Sin cambios**: `frontend/`, `backend/`, `openspec/specs/`, `CLAUDE.md`/`AGENTS.md`. `pytest` no se corre porque `backend/` no cambia.
- **Sistemas**: Easypanel (dos redespliegues sin cambios de configuración), base `global_db` de producción (recibe un libro, un cliente, una venta y un cambio de precio, todos ficticios).
- **Entregable**: ZIP generado fuera del control de versiones (`*.zip` ya está en `.gitignore`).
- **Governance**: MEDIO — push y redespliegues se confirman con el grupo; el resto se registra tal como se observa.
