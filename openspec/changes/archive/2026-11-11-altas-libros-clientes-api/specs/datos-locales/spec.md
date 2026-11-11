# Spec Delta

## MODIFIED Requirements

### Requirement: Conjunto de datos inicial

El sistema MUST disponer de un conjunto de datos local en memoria con al menos 6 libros, 2 editoriales, 2 géneros, 3 autores y 3 clientes ficticios, disponible desde la primera apertura de las vistas que todavía no consultan la API (Ventas e Historial). Las vistas Catálogo, Libros y Clientes MUST NOT usar este conjunto: sus datos provienen de la API.

#### Scenario: Cantidad mínima de registros
- **WHEN** se abre `ventas.html` con JavaScript habilitado
- **THEN** existen al menos 6 libros, 2 editoriales, 2 géneros, 3 autores y 3 clientes en los datos locales

#### Scenario: Clientes disponibles aunque el catálogo no los muestre
- **WHEN** se consultan los datos locales desde la vista Ventas
- **THEN** los 3 clientes del conjunto inicial están presentes y completos (nombre completo y email)

#### Scenario: Catálogo sin datos locales
- **WHEN** se abre `index.html`
- **THEN** no se carga el conjunto de datos local

#### Scenario: Libros y Clientes sin datos locales
- **WHEN** se abren `libros.html` o `clientes.html`
- **THEN** no se cargan el conjunto de datos local ni el módulo de persistencia

### Requirement: Identificadores estables y únicos

Cada registro MUST tener un identificador único dentro de su colección (libros, editoriales, géneros, autores y clientes), y ese identificador MUST mantenerse estable durante toda la sesión y entre renderizados.

#### Scenario: Sin identificadores repetidos
- **WHEN** se recorren los libros, editoriales, géneros, autores y clientes
- **THEN** no hay identificadores repetidos dentro de cada colección

#### Scenario: Identificador estable entre renderizados
- **WHEN** la vista Ventas vuelve a generar el selector de libros tras confirmar una venta
- **THEN** cada libro conserva el mismo identificador y sus referencias no cambian

### Requirement: Datos locales sin red ni persistencia

Las vistas que todavía no consultan la API (Ventas e Historial) MUST obtener los datos de estructuras locales en memoria. Las vistas Catálogo, Libros y Clientes quedan fuera de este requisito: obtienen sus datos de la API (ver `catalogo-libros`, `registro-libros` y `registro-clientes`).

#### Scenario: Apertura sin conexión
- **WHEN** se abre `ventas.html` con el backend detenido
- **THEN** el selector de libros de la vista se genera con los libros del conjunto inicial

#### Scenario: Perfil de navegador sin datos guardados
- **WHEN** se abre `ventas.html` en un perfil de navegador que nunca almacenó datos del proyecto
- **THEN** se ofrecen los libros y clientes del conjunto inicial sin configuración previa

### Requirement: Persistencia en localStorage
La aplicación MUST persistir libros, clientes y ventas en `localStorage` bajo las claves `libreria:libros`, `libreria:clientes` y `libreria:ventas` solo en las vistas Ventas e Historial. En el primer inicio MUST cargar los ejemplos; en reaperturas MUST recuperar los datos guardados sin duplicar ejemplos ni ventas. Las altas de libros y clientes MUST NOT escribir en `localStorage`.

#### Scenario: Primer inicio
- **WHEN** se abre la vista Ventas en un perfil sin datos guardados
- **THEN** se cargan los ejemplos a `localStorage` y se muestran

#### Scenario: Reapertura
- **WHEN** se reabre la vista Ventas tras haber guardado datos
- **THEN** se recuperan los datos guardados sin duplicar ejemplos ni ventas

#### Scenario: Guardado tras alta
- **WHEN** se confirma una venta en la vista Ventas
- **THEN** el cambio se persiste en `localStorage`

#### Scenario: Recuperación tras recarga
- **WHEN** se recarga la vista Historial tras confirmar ventas
- **THEN** los datos se recuperan sin duplicar ejemplos ni ventas

#### Scenario: Altas por la API sin almacenamiento local
- **WHEN** se registra un libro en la vista Libros o un cliente en la vista Clientes y luego se revisa `localStorage` del origen `http://127.0.0.1:8080`
- **THEN** ninguna clave `libreria:*` cambió por esas altas

## REMOVED Requirements

### Requirement: Identificador de los registros dados de alta
**Reason**: En el Global los identificadores de libros y clientes los asigna la API (PostgreSQL) al responder 201; el navegador ya no los calcula.
**Migration**: Ver «Alta efectiva de libro» en `registro-libros` y «Actualización del listado de clientes sin recargar» en `registro-clientes` (el ID viene en la respuesta 201).

### Requirement: Inserción de las altas en los datos locales
**Reason**: Las altas de libros y clientes se registran con `POST /api/libros/` y `POST /api/clientes/`; no se incorporan a colecciones locales (regla dura 4).
**Migration**: Los registros quedan en PostgreSQL y las vistas los obtienen de la API. La vista Ventas sigue con los datos locales hasta I-04.
