# datos-locales Specification

## Purpose

Define el sitio como una capa sin datos propios: libros, clientes, ventas e importes llegan siempre desde la API y el navegador no guarda registros en `localStorage` ni `sessionStorage`. El único estado local es el borrador de la venta, que vive solo en memoria.

## Requirements

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
