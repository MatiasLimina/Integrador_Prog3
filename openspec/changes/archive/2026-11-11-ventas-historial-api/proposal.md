# Proposal

## Why

El Ejercicio 3 del Global (25 puntos) y la «demostración mínima» piden registrar una venta con `POST /ventas/` y consultar el historial con `GET /ventas/` y `GET /ventas/{id}`, mostrando los importes **que devuelve la API**. Hoy `ventas.html` e `historial.html` son las últimas vistas que siguen con `datos.js` + `persistencia.js` (`localStorage`): la venta se arma con clientes y libros locales, los importes se calculan en el navegador y lo registrado en Libros/Clientes (I-03) no aparece. Con el cliente HTTP (I-02) y `Api.listarTodo` (I-03) disponibles, este change cierra la migración y elimina los datos locales del sitio.

## What Changes

- **Borrador de venta en memoria** en `ventas.html`: cliente elegido del listado `GET /clientes/` y libros del listado `GET /libros/` (ambos con `Api.listarTodo`, D-G04); agregar renglones, cambiar cantidades y quitar renglones. El borrador vive solo en una variable de `ventas.js` (sin `localStorage`) y se pierde al recargar.
- **BREAKING** (respecto del parcial): el borrador deja de calcular subtotales y total. Muestra título, precio actual del catálogo (tal como lo devuelve la API) y cantidad; los importes confirmados (precio unitario, subtotal y total) se muestran solo desde la respuesta 201 (regla dura 4).
- Validación previa pura (`validarVenta`, reescrita sin `window.Datos`): cliente elegido, ≥ 1 renglón, cantidades enteras 1..2147483647 y un solo renglón por libro; si falla, no hay petición. Agregar un libro que ya está en el borrador **suma la cantidad** a su renglón (RN-17).
- `POST /ventas/` con **exactamente** `{cliente_id, renglones:[{libro_id, cantidad}]}`; mientras se envía, «Confirmar venta» y los controles del borrador quedan deshabilitados.
- **201** → bloque «Venta registrada» con ID, fecha, cliente, renglones (precio unitario y subtotal) y total **de la respuesta**, enlace al detalle en el Historial, formulario y borrador limpios. **409** (cliente/libro inexistente, stock insuficiente), **422** (renglones repetidos, cuerpo inválido) y fallo de red → mensaje junto al formulario y **se conserva el borrador**.
- **Historial** desde `GET /ventas/?limit=&offset=` con paginación anterior/siguiente y selector de tamaño (mismo criterio que el Catálogo: la API no informa el total) y cuatro estados (cargando, vacío, error con «Reintentar», filas). «Ver detalle» pide `GET /ventas/{id}` y muestra fecha, cliente, renglones e importes históricos; `historial.html?venta=N` abre ese detalle al cargar (verificación «recargar y volver a abrir»).
- **BREAKING**: se eliminan `js/datos.js` y `js/persistencia.js`; `ventas.html` e `historial.html` cargan `api.js`, pierden filas, opciones y detalles de ejemplo escritos a mano, y el pie deja de decir «sin backend». Ninguna de las 5 páginas carga datos locales ni escribe en `localStorage`.
- Se quita el requisito «Aviso de maqueta de la etapa 1» de `navegacion-vistas`: con este change las cinco vistas operan contra la API (brecha registrada en I-02).
- Verificación manual de **G-04**, **G-05** y **G-06** servidos por Nginx, más W3C de `ventas.html` e `historial.html` y ancho de 320 px, con evidencia `evidencia/I-04-*.png`.

Fuera de alcance: edición o anulación de ventas, filtro del historial por cliente (`GET /clientes/{id}/ventas`), `PATCH` de libros desde la UI (G-05 lo usa desde la consola), mostrar o validar stock en el navegador, y cualquier cambio en `backend/`.

## Capabilities

### New Capabilities
<!-- Ninguna: el comportamiento nuevo pertenece a capacidades existentes. -->

### Modified Capabilities
- `venta-simulada`: el borrador toma clientes y libros de la API, no calcula importes, se valida sin datos locales y se confirma con `POST /ventas/`; se agregan carga de opciones, comprobante desde la respuesta, conservación del borrador ante rechazo y borrador solo en memoria; se quita «Resumen y total de la venta». (Se conserva el nombre de la capacidad por trazabilidad; ver design.)
- `historial-ventas`: listado paginado desde `GET /ventas/`, detalle con `GET /ventas/{id}` (incluido el enlace directo tras recargar), estados de carga/error e importes históricos tal como los devuelve la API.
- `datos-locales`: se quitan todos los requisitos de datos y persistencia locales y queda uno solo: ninguna vista carga datos locales ni guarda registros en el navegador.
- `servidor-frontend`: el escenario de recursos por ruta relativa deja de pedir `/js/datos.js` (eliminado).
- `navegacion-vistas`: se quita «Aviso de maqueta de la etapa 1».

## Impact

- **Archivos modificados**: `frontend/public/ventas.html`, `frontend/public/historial.html`, `frontend/public/js/ventas.js`, `frontend/public/js/historial.js`, `frontend/public/js/validaciones.js` (`validarVenta`), `frontend/public/css/estilos.css` (comprobante, paginación del historial, quitar `.aviso-maqueta`), `knowledge-base/05_reglas_de_negocio.md` y `10_preguntas_abiertas.md`.
- **Archivos eliminados**: `frontend/public/js/datos.js`, `frontend/public/js/persistencia.js`.
- **Sin cambios**: `backend/` (no se toca; `pytest` no se ve afectado), `js/api.js`, `js/altas.js`, `js/catalogo.js`, `index.html`, `libros.html`, `clientes.html`.
- **API consumida**: `GET /clientes/`, `GET /libros/` (listas, `limit` ≤ 100); `POST /ventas/` → 201 `VentaRead {id, fecha, total, cliente{id, nombre, email}, renglones[{libro_id, titulo, cantidad, precio_unitario, subtotal}]}`, 409 (cliente o libro inexistente, stock insuficiente, total excedido), 422 (`extra="forbid"`, renglones vacíos o repetidos, cantidad fuera de rango); `GET /ventas/?limit&offset` → lista de `VentaRead` ordenada por `id` ascendente, sin total; `GET /ventas/{id}` → 200 o 404.
- **Dependencias**: ninguna nueva. Requiere backend con seed (`python -m scripts.seed`: 1 venta, 4 libros, 2 clientes) y la imagen Nginx de I-01 reconstruida.
- **Desbloquea**: I-06 (verificación y entrega: G-04..G-06 desde la URL pública).
