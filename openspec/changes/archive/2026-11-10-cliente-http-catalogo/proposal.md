# Proposal

## Why

El Ejercicio 1 del Global (20 puntos) pide que el Catálogo deje de leer los libros de `datos.js`/`localStorage` y consulte la API propia con `fetch`, con la URL base y las peticiones centralizadas. Con la imagen Nginx de I-01 el frontend ya se sirve en `http://127.0.0.1:8080` y `/api/` llega al backend, así que este change es el primero que integra JavaScript con la API y deja el cliente HTTP que reutilizan I-03 (altas) e I-04 (ventas e historial).

## What Changes

- Nuevo `frontend/public/js/api.js`: base relativa `/api` definida en un único lugar, función común de petición (JSON, método, cuerpo, parámetros de consulta), distinción entre error de red y respuesta HTTP con error, y extracción del mensaje del campo `detail` (texto o lista de errores 422), tolerando cuerpos que no son JSON (el 502 de Nginx).
- Catálogo (`index.html` + `js/catalogo.js`) cargado desde `GET /api/libros/?titulo=&limit=&offset=`: la búsqueda parcial sin distinguir mayúsculas la resuelve el backend; el frontend solo recorta espacios y omite `titulo` cuando queda vacío.
- Paginación con `limit` (1–100, por defecto 20) y `offset` (≥ 0): selector «Libros por página», botones «Anterior»/«Siguiente» e indicador de rango; cambiar el filtro o el tamaño de página vuelve a `offset = 0`.
- Cada libro muestra título, ISBN, precio, editorial y género («Sin clasificar» si `genero` es `null`). **BREAKING** (respecto del parcial): los autores dejan de mostrarse en la tarjeta porque el listado no los trae.
- Detalle de libro con `GET /api/libros/{id}` desde un botón «Ver detalle» por tarjeta: datos del libro y autores con su rol, en el orden indicado por `orden`.
- Cinco estados mutuamente excluyentes y visibles: cargando, catálogo vacío, búsqueda sin coincidencias, error de conexión (con «Reintentar») y resultados.
- `index.html` deja de cargar `datos.js` y `persistencia.js` y pierde las cuatro tarjetas de ejemplo escritas a mano; el pie deja de decir «sin backend».
- Verificación manual del caso **G-01** (buscar, paginar, búsqueda sin coincidencias, detalle) servido por Nginx, más W3C de `index.html`, con evidencia `evidencia/I-02-*.png`.

Fuera de alcance: altas de libros y clientes (I-03), ventas e historial (I-04), las otras cuatro páginas (siguen con `datos.js`/`persistencia.js` hasta su change), filtro por género (`genero_id`), cambios en el backend.

## Capabilities

### New Capabilities
- `cliente-http`: cómo el frontend se comunica con la API — base relativa `/api` única, rutas exactas del backend, envío y recepción de JSON, clasificación de fallos (red vs. HTTP) y mensaje legible a partir de `detail`.

### Modified Capabilities
- `catalogo-libros`: el catálogo pasa de datos locales a la API — se agregan carga desde `GET /libros/`, paginación y detalle con autores; cambian los datos de cada tarjeta (sin autores), los estados (se suman cargando y error de conexión), el filtro (lo resuelve el backend) y la inserción segura (datos de la API); se quitan los requisitos de datos de ejemplo locales.
- `navegacion-vistas`: «Punto de entrada y vistas disponibles» deja de exigir abrir las vistas «sin servidor»: el sitio se usa servido por Nginx (pendiente señalado en I-01).
- `datos-locales`: «Conjunto de datos inicial», «Identificadores estables y únicos» y «Datos locales sin red ni persistencia» dejan de referirse a la vista Catálogo; los datos locales quedan solo para las vistas aún no integradas (Libros, Clientes, Ventas, Historial).

## Impact

- **Archivos nuevos**: `frontend/public/js/api.js`.
- **Archivos modificados**: `frontend/public/index.html`, `frontend/public/js/catalogo.js`, `frontend/public/css/estilos.css` (paginación, detalle, mensaje de error del catálogo), `knowledge-base/10_preguntas_abiertas.md` (brechas de contrato halladas).
- **API consumida** (sin cambios en `backend/`): `GET /libros/` → lista de `LibroRead` (sin total); `GET /libros/{id}` → `LibroDetalleRead` o 404 `{"detail": "El libro no existe."}`; 422 con `detail` lista ante parámetros inválidos.
- **Dependencias**: ninguna nueva; JavaScript nativo (`fetch`, `URLSearchParams`). Requiere backend con seed y contenedor Nginx de I-01 para verificar.
- **Desbloquea**: I-03 e I-04, que reutilizan `api.js`.
