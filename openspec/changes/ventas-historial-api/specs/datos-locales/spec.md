# Spec Delta

## ADDED Requirements

### Requirement: Sitio sin datos locales
Ninguna de las cinco vistas MUST cargar un conjunto de datos local ni un módulo de persistencia, y el frontend MUST NOT guardar libros, clientes, ventas ni importes en `localStorage`, `sessionStorage` ni cookies: todos los registros provienen de la API. El único estado propio del navegador es el borrador de la venta, en memoria.

#### Scenario: Páginas sin datos locales
- **WHEN** se buscan `datos.js` y `persistencia.js` en los `<script>` de `index.html`, `libros.html`, `clientes.html`, `ventas.html` e `historial.html`
- **THEN** no hay coincidencias y esos archivos ya no existen en `frontend/public/js/`

#### Scenario: Almacenamiento del navegador vacío
- **WHEN** en un perfil limpio se recorren las cinco vistas, se registra una venta y se revisan `localStorage` y `sessionStorage` del origen `http://127.0.0.1:8080`
- **THEN** no hay ninguna entrada creada por el sitio (ninguna clave `libreria:*`)

#### Scenario: Sin respaldo local ante backend caído
- **WHEN** se abren `ventas.html` o `historial.html` con el backend detenido
- **THEN** las vistas muestran su error de conexión y no ofrecen libros, clientes ni ventas de ejemplo

## REMOVED Requirements

### Requirement: Conjunto de datos inicial
**Reason**: Ventas e Historial, las últimas vistas que lo usaban, pasan a la API; `js/datos.js` se elimina (regla dura 4).
**Migration**: Los datos iniciales los carga el backend con `python -m scripts.seed`; ver «Sitio sin datos locales».

### Requirement: Referencias válidas de los libros
**Reason**: Ya no hay libros locales; la integridad de editorial, género y autores la garantiza PostgreSQL (FK) y la API responde 409.
**Migration**: Ver `registro-libros` (errores del servidor ante referencias inexistentes).

### Requirement: Cobertura mínima de casos del conjunto inicial
**Reason**: El conjunto local se elimina; los casos (libro sin género, libro con varios autores) los provee el seed del backend.
**Migration**: El seed deja «Antología de la literatura fantástica» sin género y con tres autores; ver `catalogo-libros`.

### Requirement: Identificadores estables y únicos
**Reason**: Los identificadores los asigna la base al registrar; el navegador no los genera.
**Migration**: Ver «Selección de cliente» y «Alta de renglón» en `venta-simulada` (los valores de los selectores son los IDs de la API).

### Requirement: Datos locales sin red ni persistencia
**Reason**: Ventas e Historial obtienen sus datos de la API.
**Migration**: Ver «Carga de opciones de la venta» en `venta-simulada` y «Listado de ventas» en `historial-ventas`.

### Requirement: Seed de ventas de ejemplo
**Reason**: Las ventas de ejemplo locales se eliminan; el seed del backend carga la venta 1.
**Migration**: Ver «Contenido del detalle de venta» en `historial-ventas` (venta 1 del seed).

### Requirement: Alta de venta
**Reason**: La venta se registra con `POST /api/ventas/`; el ID, la fecha, los precios unitarios, los subtotales y el total los asigna la API.
**Migration**: Ver «Confirmación de la venta» y «Comprobante de la venta registrada» en `venta-simulada`.

### Requirement: Inmutabilidad de las ventas confirmadas
**Reason**: Requisito duplicado: ya lo cubre `historial-ventas`, y la API no expone edición ni borrado de ventas.
**Migration**: Ver «Ventas confirmadas sin edición» en `historial-ventas`.

### Requirement: Persistencia en localStorage
**Reason**: La persistencia es PostgreSQL vía la API (D-G01); `js/persistencia.js` se elimina y el navegador no guarda registros.
**Migration**: Ver «Sitio sin datos locales» y «Borrador solo en memoria» en `venta-simulada`.

### Requirement: Precio histórico preservado en persistencia
**Reason**: El precio histórico lo conserva la base en cada renglón de la venta.
**Migration**: Ver «Detalle con precio histórico» en `historial-ventas` (caso G-05 con `PATCH /api/libros/{id}`).
