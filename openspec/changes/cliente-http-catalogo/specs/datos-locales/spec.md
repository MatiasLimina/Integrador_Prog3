# Spec Delta

## MODIFIED Requirements

### Requirement: Conjunto de datos inicial

El sistema MUST disponer de un conjunto de datos local en memoria con al menos 6 libros, 2 editoriales, 2 géneros, 3 autores y 3 clientes ficticios, disponible desde la primera apertura de las vistas que todavía no consultan la API (Libros, Clientes, Ventas e Historial). La vista Catálogo MUST NOT usar este conjunto: sus libros provienen de la API.

#### Scenario: Cantidad mínima de registros
- **WHEN** se abre `libros.html` con JavaScript habilitado
- **THEN** existen al menos 6 libros, 2 editoriales, 2 géneros, 3 autores y 3 clientes en los datos locales

#### Scenario: Clientes disponibles aunque el catálogo no los muestre
- **WHEN** se consultan los datos locales desde la vista Libros
- **THEN** los 3 clientes del conjunto inicial están presentes y completos (nombre completo y email)

#### Scenario: Catálogo sin datos locales
- **WHEN** se abre `index.html`
- **THEN** no se carga el conjunto de datos local

### Requirement: Identificadores estables y únicos

Cada registro MUST tener un identificador único dentro de su colección (libros, editoriales, géneros, autores y clientes), y ese identificador MUST mantenerse estable durante toda la sesión y entre renderizados.

#### Scenario: Sin identificadores repetidos
- **WHEN** se recorren los libros, editoriales, géneros, autores y clientes
- **THEN** no hay identificadores repetidos dentro de cada colección

#### Scenario: Identificador estable entre renderizados
- **WHEN** el listado de libros de la vista Libros se vuelve a renderizar tras un alta
- **THEN** cada libro conserva el mismo identificador y sus referencias no cambian

### Requirement: Datos locales sin red ni persistencia

Las vistas que todavía no consultan la API MUST obtener los datos de estructuras locales en memoria. La vista Catálogo queda fuera de este requisito: obtiene los libros de la API (ver `catalogo-libros`).

#### Scenario: Apertura sin conexión
- **WHEN** se abre `libros.html` con el backend detenido
- **THEN** el listado de libros de la vista se genera con los libros del conjunto inicial

#### Scenario: Perfil de navegador sin datos guardados
- **WHEN** se abre `libros.html` en un perfil de navegador que nunca almacenó datos del proyecto
- **THEN** se listan los libros del conjunto inicial sin configuración previa
