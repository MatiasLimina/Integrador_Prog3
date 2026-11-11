# Design

## Context

- **Estado actual del frontend** (ver proposal.md — Why): `libros.html` y `clientes.html` cargan `datos.js`, `persistencia.js`, `validaciones.js` y `altas.js`. `altas.js` es un IIFE que expone `window.Altas`, sirve a las dos páginas (detecta `#form-libro` / `#form-cliente`), genera selectores y casillas desde `window.Datos` y guarda en `localStorage`. `validaciones.js` expone `validarLibro`/`validarCliente` (leen `window.Datos` para existencia y unicidad) y `validarVenta`, que sigue usando `ventas.js` hasta I-04. Nadie fuera de `altas.js` usa `normalizarIsbn`/`normalizarEmail` ni `window.Altas`.
- **Cliente HTTP de I-02**: `window.Api.pedir(ruta, {metodo, parametros, cuerpo})` → `Promise` con el JSON; rechaza con `{tipo: "red" | "http", estado, mensaje}` y ya arma el mensaje desde `detail` (texto o lista 422, sin el prefijo `Value error, `). La ruta se pasa exacta (colección con barra final, recurso sin barra).
- **Contrato relevado en `backend/app/modules/`** (sin cambios en `backend/`):
  - `GET /editoriales/`, `/generos/`, `/autores/`, `/libros/`, `/clientes/` → **listas** ordenadas por `id`, paginadas con `limit` (1–100, **20 por defecto**) y `offset`, sin total. Sin `limit=100` un selector mostraría solo 20 opciones.
  - `POST /libros/` (`LibroCreate`): `isbn` (1–30, no vacío), `titulo` (1–255, no vacío), `precio` `Decimal` > 0 con `max_digits=10, decimal_places=2` (acepta número o cadena; verificado: `"18500.50"` → `Decimal('18500.50')`), `stock` int 0..2147483647 (**por defecto 0** si se omite), `editorial_id` ≥ 1, `genero_id` ≥ 1 o `null`, `autores` lista (**acepta vacía**) de `{autor_id ≥ 1, rol ∈ {autor, coautor, traductor, ilustrador} (normaliza a minúsculas), orden 1..2147483647}`. Respuesta 201 `LibroDetalleRead` (con `editorial`, `genero`, `autores[{autor_id, nombre, rol, orden}]` ordenados por `orden`). 409 por constraint: ISBN repetido («Ya existe un libro con ese ISBN.»), editorial/género/autor inexistente, **mismo autor dos veces** (`pk_libro_autor`). El ISBN se compara **exacto** (con guiones y espacios tal cual); `orden` repetido entre autores **se acepta**.
  - `POST /clientes/` (`ClienteCreate`, `extra="forbid"`): `nombre` (1–150, no vacío), `email` `EmailStr` (≤ 255). Respuesta 201 `ClienteRead {id, nombre, email}`; 409 «Ya existe un cliente con ese email.»; 422 ante campos extra (`nombreCompleto`). `EmailStr` solo pasa el **dominio** a minúsculas (verificado: `Lucia@EXAMPLE.com` → `Lucia@example.com`), así que `Lucia@…` y `lucia@…` son emails distintos para la base.
  - `GET /clientes/{id}` → 200 `ClienteDetalleRead {id, nombre, email, perfil}` o 404 «El cliente no existe.»; id fuera de int32 → 422.
- **Seed**: 3 editoriales, 3 géneros, 5 autores (Cortázar, Piglia, Bioy Casares, Ocampo, Borges), 4 libros, 2 clientes (Lucía Fernández, Tomás Ríos).
- **Decisión vigente D-G04** (`knowledge-base/09`): selectores de autores y clientes desde los listados, en páginas de `limit=100` avanzando `offset` hasta recibir menos de 100; `GET /clientes/{id}` para «recuperar por ID» (G-03).
- La imagen Nginx copia `public/` al construir: para ver cambios hay que reconstruir o montar la carpeta (igual que en I-02).

## Goals / Non-Goals

**Goals:**
- Cubrir G-02 y G-03 completos desde la UI servida por Nginx, incluido ver el 409 del servidor.
- Que el cuerpo de cada `POST` sea exactamente el del contrato, armado en un solo lugar y verificable en la pestaña Red.
- Dejar en `api.js` la lectura completa de listados para que I-04 cargue clientes y libros sin repetir el bucle.

**Non-Goals:**
- Validar en el navegador la existencia de editorial, género o autores (la decide la base con 409) o la unicidad de ISBN/email.
- Paginación visible en las tablas de Libros y Clientes, búsqueda por nombre, alta de autores/editoriales/géneros, `PATCH`, perfil de cliente.
- Migrar `ventas.html`/`historial.html` o borrar `datos.js`/`persistencia.js` (I-04).
- Cambios en `backend/`: este change no lo toca, así que `pytest` no se ve afectado.

## Decisions

1. **`Api.listarTodo(ruta)` en `api.js`.** Pide `ruta` con `{limit: 100, offset}` en secuencia (0, 100, 200…) sobre `pedir`, concatena y resuelve cuando una página trae menos de 100 elementos; si una página falla, rechaza con el mismo objeto de error (sin resultados parciales). Se usa para editoriales, géneros, autores, libros y clientes, y la reutiliza I-04 (D-G04). *Alternativas*: un `limit=100` fijo sin bucle → trunca en silencio con más de 100 registros; el bucle dentro de `altas.js` → I-04 lo duplicaría.

2. **Selectores desde los listados (D-G04), no consulta por ID.** Editorial, Género y Autor se llenan con `listarTodo` en paralelo (`Promise.all`) al abrir la vista. Mientras cargan, "Registrar libro" y "Agregar autoría" quedan deshabilitados; si alguna falla, un mensaje `role="alert"` propio de las opciones con "Reintentar" relanza las tres. *Alternativa*: verificar cada autor con `GET /autores/{id}` y mostrar su nombre antes de agregarlo (lo sugiere la consigna) → descartada por D-G04: obliga a conocer los IDs de memoria y suma un paso por autoría; la consigna permite listados si la API los tiene y pide documentar la elección (lo hace el README en I-06).

3. **Editor de autorías como borrador del formulario.** Dentro de `<fieldset id="libro-autorias">` (leyenda «Autores (agregá al menos uno)»): selector "Autor" (opción inicial «Elegí un autor» + listado), selector "Rol" con las cuatro opciones fijas en el HTML (`value` en minúsculas, «autor» seleccionado), campo "Orden" (`type="number" min="1" step="1"`, sugiere 1), botón `type="button"` "Agregar autoría", un mensaje de error propio `role="alert"` junto al editor, y una `<ol>` con las autorías. `altas.js` guarda en memoria `autorias = [{autor_id, nombre, rol, orden}]` (borrador del formulario, no un registro confirmado: no viola la regla dura 4), la muestra ordenada por `orden` (empates en orden de carga) y cada ítem lleva «Nombre — rol (orden N)» y un botón "Quitar" con `<span class="visualmente-oculto"> a «Nombre»</span>` vía `textContent`. Tras agregar, "Orden" sugiere `máximo + 1`. *Alternativas*: filas editables con controles por autoría → más controles por fila y validación más difícil de mostrar; casillas + rol/orden por casilla → no escala con el listado de la API.

4. **Validaciones puras sin `window.Datos`.** `validaciones.js` reescribe `validarLibro(entrada, autorias)` y `validarCliente(entrada)` y suma `validarAutoria(entrada, autorias)` y `validarIdCliente(texto)`. Devuelven `{valido, errores, cuerpo}` donde `cuerpo` es **exactamente** el JSON del contrato (`{isbn, titulo, precio, stock, editorial_id, genero_id, autores}` / `{nombre, email}`), así el armado vive en un solo lugar. Se quitan `normalizarIsbn`/`normalizarEmail` (sin otros usos) y `validarVenta` queda intacta para `ventas.js`. Reglas por campo en los specs; detalles de armado:
   - `titulo`/`isbn`/`nombre`/`email` se envían con `trim()`.
   - `precio`: se valida el texto recortado (`Number` no `NaN`, > 0, patrón `^\d+(\.\d{1,2})?$`, ≤ 99999999.99) y se envía **como cadena** tal como se escribió, para que `Decimal` reciba el valor exacto sin pasar por coma flotante. *Alternativa*: enviar `Number` → funciona hoy, pero agrega una conversión innecesaria de un importe.
   - `stock`: patrón entero (mensaje propio si es negativo), ≤ 2147483647, se envía como número. Vacío es error (no se delega al `default=0` del backend, para que el operador lo escriba explícitamente como pide la consigna).
   - `editorial_id` numérico; `genero_id` `null` si «Sin clasificar». `autores` = `[{autor_id, rol, orden}]` sin el `nombre` del borrador.
   - `validarAutoria`: autor elegido, rol ∈ los cuatro, orden entero 1..2147483647, autor no repetido (el backend respondería 409 por `pk_libro_autor`). Un `orden` repetido se admite, como en el backend.

5. **Unicidad de ISBN y email delegada a la API.** El navegador no compara contra los listados cargados: el 409 del servidor es la fuente de verdad y es lo que G-02/G-03 piden observar. *Alternativa*: seguir comparando (normalizado) contra el listado cargado → bloquearía en el navegador justo el caso que hay que demostrar, y daría falsos «libre» si otro operador registró algo después de cargar la página. Consecuencia documentada (KB 05 y 10): la API compara exacto, así que `978-950…` vs `978950…` o `Lucia@…` vs `lucia@…` se registran como distintos.

6. **Envío y respuesta.** Al enviar: `preventDefault`, ocultar mensajes, validar; si hay errores se listan sin pedir nada. Si es válido, se deshabilita el botón de envío, `Api.pedir("/libros/", {metodo: "POST", cuerpo})` (o `"/clientes/"`), y en ambas ramas se rehabilita.
   - **201**: se usa el registro devuelto — Libros: se completa y muestra el bloque «Libro registrado» (`<div id="libro-registrado" class="detalle-libro" hidden>` junto al formulario: `<dl>` con ID, título, ISBN, precio, stock, editorial, género y una `<ol>` de autorías) y se agrega una fila al listado; Clientes: se agrega la fila y el mensaje de éxito dice «Cliente registrado correctamente con ID N.». Luego `form.reset()`, se vacía el borrador de autorías y "Orden" vuelve a 1.
   - **Error**: un único ítem en la lista de errores, `"(" + estado + ") " + mensaje` si `tipo === "http"`, o el mensaje de red tal cual; el formulario y el borrador se conservan.
   *Alternativa*: volver a pedir el listado completo tras el 201 → una petición extra; la consigna pide usar el registro devuelto.

7. **Listados de Libros y Clientes con `listarTodo` y estados propios.** Cada tabla tiene cuatro estados excluyentes (cargando, vacío, error con "Reintentar", con filas), con el mismo conmutador que el Catálogo (`hidden` en mensajes y tabla). La tabla de Libros pasa a Título, ISBN, Editorial, Género, Precio, Stock (sin Autores: `LibroRead` no los trae y pedir `GET /libros/{id}` por fila sería N+1); el precio se muestra tal como llega (cadena con dos decimales, igual que I-02). La de Clientes suma la columna ID (necesaria para G-03 y para I-04). *Alternativa*: paginar las tablas como el Catálogo → más controles sin pedido de la consigna para estas vistas; con los volúmenes del TP la lectura completa es chica.

8. **Búsqueda de cliente por ID.** Nueva `<section>` en `clientes.html` con `<form id="form-buscar-cliente" role="search" novalidate>`: campo "ID del cliente" (`type="number" min="1" step="1"`), botón "Buscar", mensajes cargando (`status`) y error (`alert`), y un `<dl>` de resultado (ID, nombre, email). `GET /clientes/{id}` con contador de solicitudes para descartar respuestas viejas (patrón de I-02). Antes de cada búsqueda se oculta el resultado anterior. No se muestra el `perfil` (fuera de alcance).

9. **Un solo `altas.js` para las dos páginas.** Se mantiene el IIFE y la detección por formulario; se reorganiza en secciones (comunes, libros, autorías, clientes, búsqueda por ID). *Alternativa*: separar `libros.js` y `clientes.js` → duplicaría los helpers de mensajes; se puede hacer después sin cambiar specs.

10. **Marcado y estilos.** Ambas páginas: se quitan filas de ejemplo y opciones/casillas escritas a mano (los `<select>` quedan solo con su opción inicial), `<script defer>` pasa a `api.js`, `validaciones.js`, `altas.js`, y el pie pasa a «TPI Programación III — datos ficticios servidos por la API de la librería.» (texto de I-02). `estilos.css`: `.autorias` (controles en Flexbox con `flex-wrap`, lista con botón al final de cada ítem) y reutilización de `.detalle-libro`, `.campo`, `.mensaje*`, `.tabla-contenedor`; sin `style=` ni `<style>`. Todo dato de usuario o de la API se escribe con `textContent` (incluidos los mensajes del servidor).

## Risks / Trade-offs

- [La API compara ISBN y email exactos] → duplicados «lógicos» (guiones, mayúsculas en la parte local) se aceptan. Mitigación: documentado en la KB como brecha de contrato; no se cambia el backend en este change. Si el grupo quiere cerrarla, es un change de backend aparte.
- [Transición hasta I-04] → Ventas sigue con clientes y libros locales: lo registrado por la API no aparece allí. Se acepta; I-04 lo resuelve con `listarTodo`.
- [Doble envío] → dos `POST` seguidos darían un 409 espurio. Mitigación: botón deshabilitado mientras se espera la respuesta.
- [Opciones desactualizadas] → si otro operador agrega un autor, no aparece hasta recargar. Aceptado (un operador, sin tiempo real).
- [Datos de prueba en la base local] → G-02/G-03 crean registros. Mitigación: restaurar con `python -m scripts.seed` (vacía tablas) en local; nunca correr el seed en el despliegue sin revisar (I-05).
- [Casos de 409 por FK (editorial/género/autor inexistente)] → no se pueden provocar desde la UI normal. Mitigación: verificarlos desde la consola del navegador con `Api.pedir` y un ID inexistente, o borrando el registro en local; se registran como verificación complementaria, no como parte de G-02.

## Migration Plan

Solo frontend: `libros.html`, `clientes.html`, `js/altas.js`, `js/validaciones.js`, `js/api.js`, `css/estilos.css`, más notas en `knowledge-base/05` y `10`. Para verlo: reconstruir la imagen (`docker build -t libreria-frontend .` en `frontend/`) y ejecutarla como indica el README (backend con seed en `:8000`). Rollback: revertir el commit; las dos vistas vuelven a los datos locales sin afectar Catálogo, Ventas ni Historial.
