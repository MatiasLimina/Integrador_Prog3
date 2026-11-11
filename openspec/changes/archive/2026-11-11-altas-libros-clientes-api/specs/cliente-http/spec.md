# Spec Delta

## ADDED Requirements

### Requirement: Lectura completa de listados paginados
Cuando una vista necesita una colección completa (editoriales, géneros, autores, libros o clientes), el cliente MUST pedirla en páginas de `limit=100` empezando en `offset=0` y avanzando de a 100 hasta recibir una página con menos de 100 elementos, y MUST entregar todos los elementos juntos en el orden recibido. Si falla cualquier página, la lectura completa MUST fallar con el mismo error informado por esa página y MUST NOT entregar resultados parciales.

#### Scenario: Colección chica en una sola petición
- **WHEN** con el seed cargado se abre la vista Libros
- **THEN** la pestaña Red muestra una única petición `GET /api/autores/?limit=100&offset=0` (lo mismo para editoriales y géneros) y el selector "Autor" ofrece los 5 autores

#### Scenario: Página completa obliga a seguir
- **WHEN** la primera página devuelve exactamente 100 elementos
- **THEN** se pide `offset=100` y la lectura termina cuando una página trae menos de 100 elementos, incluida una página vacía

#### Scenario: Falla una página
- **WHEN** el backend se detiene durante la lectura de un listado
- **THEN** la vista recibe un fallo de conexión y no muestra una lista incompleta
