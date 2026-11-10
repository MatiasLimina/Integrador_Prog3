# Spec Delta

## MODIFIED Requirements

### Requirement: Punto de entrada y vistas disponibles
El proyecto SHALL tener `index.html` como punto de entrada y MUST ofrecer cinco vistas: Catálogo, Libros, Clientes, Ventas e Historial, servidas por el contenedor Nginx del frontend (`http://127.0.0.1:8080` en local) sin npm ni build. Las vistas MUST usarse servidas por HTTP y no abiertas como archivo, porque consultan la API bajo el mismo origen.

#### Scenario: Apertura del punto de entrada
- **WHEN** con el contenedor del frontend en ejecución se abre `http://127.0.0.1:8080/`
- **THEN** se muestra la vista Catálogo con el nombre de la librería y la navegación principal

#### Scenario: Cada vista existe
- **WHEN** se recorren los enlaces de la navegación principal
- **THEN** cada uno de los cinco enlaces abre su vista sin errores 404
