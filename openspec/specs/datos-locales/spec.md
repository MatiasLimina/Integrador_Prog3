# datos-locales Specification

## Purpose

Define el modelo de datos local de la librería (libros, editoriales, géneros, autores y clientes) con identificadores estables y relaciones válidas, que alimenta el catálogo, las altas y las ventas sin depender de red ni de un backend.

## Requirements

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

### Requirement: Referencias válidas de los libros

Cada libro MUST referenciar una editorial existente y uno o más autores existentes. El género SHALL ser opcional; cuando está asignado MUST corresponder a un género existente.

#### Scenario: Editorial y autores existentes
- **WHEN** se recorre cualquier libro del conjunto inicial
- **THEN** su editorial y todos sus autores existen en las colecciones de editoriales y autores

#### Scenario: Género ausente
- **WHEN** un libro no tiene género asignado
- **THEN** no presenta referencia a un género inexistente y se interpreta como «Sin clasificar»

#### Scenario: Género asignado existente
- **WHEN** un libro tiene género asignado
- **THEN** ese género existe en la colección de géneros

### Requirement: Cobertura mínima de casos del conjunto inicial

El conjunto inicial MUST incluir al menos un libro sin género y al menos un libro con dos o más autores, para que la presentación de esos casos pueda verificarse sin cargar datos.

#### Scenario: Libro sin género disponible
- **WHEN** se revisan los libros del conjunto inicial
- **THEN** al menos uno no tiene género asignado

#### Scenario: Libro con varios autores disponible
- **WHEN** se revisan los libros del conjunto inicial
- **THEN** al menos uno tiene dos o más autores

#### Scenario: Precios válidos
- **WHEN** se revisan los libros del conjunto inicial
- **THEN** todos tienen un precio numérico mayor que cero

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

### Requirement: Seed de ventas de ejemplo
Los datos locales MUST incluir al menos dos ventas de ejemplo con identificador, fecha, cliente, renglones (con título y precio unitario histórico) y total, para que el Historial muestre contenido al abrir.

#### Scenario: Ventas de ejemplo presentes
- **WHEN** se abren los datos locales por primera vez
- **THEN** existen al menos dos ventas con id, fecha, cliente, renglones y total

### Requirement: Alta de venta
Una venta confirmada MUST registrarse en los datos locales con identificador entero incremental, fecha ISO 8601, cliente (id y nombre descriptivo), renglones con libroId, título descriptivo, cantidad, precio unitario histórico y subtotal, y total. El renglón MUST copiar el precio unitario y el título al confirmar, sin releeerlos del catálogo.

#### Scenario: Venta registrada
- **WHEN** se confirma una venta válida
- **THEN** la venta se agrega a los datos locales con id, fecha, cliente, renglones y total

#### Scenario: Precio unitario histórico
- **WHEN** se revisa una venta confirmada
- **THEN** cada renglón conserva el precio unitario copiado al confirmar, independientemente del precio actual del libro en el catálogo

### Requirement: Inmutabilidad de las ventas confirmadas
Las ventas confirmadas MUST NOT poder editarse ni eliminarse desde la interfaz.

#### Scenario: Sin controles de edición
- **WHEN** se recorre la vista Historial con Tab
- **THEN** no hay campos editables ni botones de editar o eliminar ventas

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

### Requirement: Precio histórico preservado en persistencia
El precio unitario de una venta confirmada MUST conservarse aunque cambie el precio del libro en el catálogo guardado en `localStorage`.

#### Scenario: Cambio de precio en catálogo
- **WHEN** se modifica el precio del libro en `localStorage` y se recarga
- **THEN** la venta conserva su precio unitario, subtotales y total
