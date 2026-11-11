# Spec Delta

## MODIFIED Requirements

### Requirement: Sitio estático servido desde public/
El frontend SHALL servirse por HTTP en el puerto interno 80, entregando los archivos de `frontend/public/` tal cual, en la ruta relativa que tienen dentro de esa carpeta, con `index.html` como documento de `/`. La imagen MUST basarse en la imagen oficial `nginx:1.30-alpine` y MUST NOT requerir npm ni un paso de build.

#### Scenario: Raíz del sitio
- **WHEN** se pide `GET /` al contenedor publicado en `http://127.0.0.1:8080`
- **THEN** responde 200 con el contenido de `public/index.html` y la vista Catálogo se ve con sus estilos

#### Scenario: Páginas y recursos por ruta relativa
- **WHEN** se piden `/libros.html`, `/css/estilos.css` y `/js/api.js`
- **THEN** cada uno responde 200 con el archivo correspondiente de `public/`

#### Scenario: Archivos eliminados no se sirven
- **WHEN** con la imagen reconstruida se piden `/js/datos.js` y `/js/persistencia.js`
- **THEN** cada uno responde 404
