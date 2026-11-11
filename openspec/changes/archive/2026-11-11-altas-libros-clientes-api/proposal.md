# Proposal

## Why

El Ejercicio 2 del Global (20 puntos) pide que las altas de libros y clientes dejen de simularse en el navegador y se registren con `POST /libros/` y `POST /clientes/` contra la API, con las opciones de editorial, género y autores cargadas desde la API y el mensaje del servidor visible ante un 409 o 422. Hoy `libros.html` y `clientes.html` validan y guardan contra `datos.js` + `localStorage`, el formulario de libro no tiene `stock` ni autorías `{autor_id, rol, orden}` y el de clientes envía `nombreCompleto` (el backend espera `nombre` y rechaza campos extra con 422). Con el cliente HTTP de I-02 ya disponible, este change cierra esas brechas y deja el listado de clientes desde la API que reutiliza I-04.

## What Changes

- `libros.html`: se agrega el campo **Stock** (entero ≥ 0); Editorial y Género se cargan desde `GET /editoriales/` y `GET /generos/` (Género sigue opcional con «Sin clasificar»).
- **BREAKING** (respecto del parcial): las casillas fijas de autores se reemplazan por un **editor de autorías**: se elige el autor del listado `GET /autores/` (D-G04), el rol (autor, coautor, traductor, ilustrador) y el orden (entero ≥ 1), se agrega a una lista y se puede quitar. El front exige al menos una autoría y no admite el mismo autor dos veces.
- Alta de libro con `POST /libros/` y el cuerpo exacto `{isbn, titulo, precio, stock, editorial_id, genero_id, autores:[{autor_id, rol, orden}]}`; botón deshabilitado mientras se envía; 201 → se muestra el libro registrado (con su ID y sus autorías) y se agrega al listado usando el registro devuelto; 409/422 → se muestra el mensaje del servidor junto al formulario, conservando lo escrito.
- Listado de la vista Libros desde `GET /libros/` (columnas título, ISBN, editorial, género, precio y stock). **BREAKING**: la columna «Autores» se quita porque el listado de la API no la trae.
- `clientes.html`: el nombre se envía como **`nombre`** con `POST /clientes/` y el cuerpo exacto `{nombre, email}`; 201 → se informa el ID asignado y se agrega al listado; listado desde `GET /clientes/` con columna ID; nueva búsqueda **«Buscar cliente por ID»** con `GET /clientes/{id}` (caso G-03).
- **BREAKING**: la unicidad de ISBN y email deja de comprobarse en el navegador (ya no hay copia local de los registros); la decide el backend y el front muestra su 409. Las validaciones de formato, obligatoriedad y rangos siguen en el front antes de enviar.
- `api.js` suma una lectura completa de listados paginados (`limit=100` y `offset` creciente hasta recibir menos de 100), usada por editoriales, géneros, autores, libros y clientes, y reutilizable por I-04.
- `libros.html` y `clientes.html` dejan de cargar `datos.js` y `persistencia.js`, pasan a cargar `api.js`, pierden las filas de ejemplo escritas a mano y el pie deja de decir «sin backend». `validaciones.js` reescribe `validarLibro`/`validarCliente` sin depender de `window.Datos` (`validarVenta` queda igual hasta I-04).
- Verificación manual de los casos **G-02** y **G-03** servidos por Nginx, más W3C de `libros.html` y `clientes.html`, con evidencia `evidencia/I-03-*.png`.

Fuera de alcance: ventas e historial (I-04; `ventas.html`/`historial.html` siguen con `datos.js`/`persistencia.js`), alta de autores/editoriales/géneros desde la UI, edición (`PATCH`) de libros o clientes, perfil de cliente, el requisito «Aviso de maqueta de la etapa 1» de `navegacion-vistas`, y cualquier cambio en `backend/`.

## Capabilities

### New Capabilities
<!-- Ninguna: el comportamiento nuevo pertenece a capacidades existentes. -->

### Modified Capabilities
- `registro-libros`: el formulario suma stock y editor de autorías; editorial, género, autores y listado vienen de la API; el alta pasa a `POST /libros/` con el registro devuelto; se suman los errores del servidor (409/422/red) y el estado de envío; se quitan la selección por casillas y la unicidad de ISBN local.
- `registro-clientes`: el alta pasa a `POST /clientes/` con `{nombre, email}`; el listado viene de `GET /clientes/` con ID; se agrega la consulta por ID; se suman los errores del servidor y el estado de envío; se quita la unicidad de email local.
- `cliente-http`: se agrega la lectura completa de un listado paginado (páginas de 100 hasta agotar), compartida por las altas y por I-04.
- `datos-locales`: los datos locales quedan solo para Ventas e Historial; se quitan los requisitos de identificador e inserción de altas de libros y clientes, y la persistencia en `localStorage` deja de recibir esas altas.

## Impact

- **Archivos modificados**: `frontend/public/libros.html`, `frontend/public/clientes.html`, `frontend/public/js/altas.js`, `frontend/public/js/validaciones.js`, `frontend/public/js/api.js` (función de listado completo), `frontend/public/css/estilos.css` (editor de autorías y búsqueda por ID), `knowledge-base/05_reglas_de_negocio.md` y `10_preguntas_abiertas.md` (unicidad delegada al servidor y brechas halladas).
- **Sin cambios**: `backend/` (no se toca; `pytest` no se ve afectado), `ventas.html`, `historial.html`, `ventas.js`, `historial.js`, `datos.js`, `persistencia.js`.
- **API consumida**: `GET /editoriales/`, `GET /generos/`, `GET /autores/`, `GET /libros/`, `GET /clientes/` (listas paginadas, `limit` ≤ 100, sin total); `POST /libros/` → 201 `LibroDetalleRead`, 409 (ISBN repetido, editorial/género/autor inexistente, autor repetido), 422; `POST /clientes/` → 201 `ClienteRead`, 409 (email repetido), 422 (incluye campos extra); `GET /clientes/{id}` → 200 `ClienteDetalleRead` o 404.
- **Dependencias**: ninguna nueva. Requiere el backend con seed y la imagen Nginx de I-01 para verificar.
- **Transición conocida**: hasta I-04, `ventas.html` sigue usando los clientes y libros locales, así que lo registrado por la API no aparece en Ventas.
- **Desbloquea**: I-04 (selector de clientes desde la API y listado completo reutilizable).
