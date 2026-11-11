# servidor-frontend Specification

## Purpose
Define cómo se entrega el frontend en ejecución: un único origen que sirve los archivos estáticos de `public/` y reenvía `/api/` al backend configurado, sin exponer el backend ni la configuración.

## Requirements

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

### Requirement: Rutas inexistentes responden 404
Toda ruta fuera de `/api/` que no corresponda a un archivo o carpeta de `public/` MUST responder 404; el servidor MUST NOT devolver `index.html` como respaldo.

#### Scenario: Página inexistente
- **WHEN** se pide `GET /no-existe.html`
- **THEN** la respuesta es 404

### Requirement: Proxy de /api/ al backend sin el prefijo
Toda petición cuya ruta empiece con `/api/` MUST reenviarse al backend conservando método, cuerpo, resto de la ruta y query string, pero sin el prefijo `/api`; la respuesta del backend (código y cuerpo) MUST llegar al navegador bajo el mismo origen que el sitio.

#### Scenario: Salud del backend bajo el origen del sitio
- **WHEN** con el backend activo se pide `GET http://127.0.0.1:8080/api/health/ready`
- **THEN** el backend recibe `GET /health/ready` y el navegador obtiene 200

#### Scenario: Ruta del backend con barra final y query
- **WHEN** se pide `GET /api/libros/?limit=5&offset=0`
- **THEN** el backend recibe `GET /libros/?limit=5&offset=0` y su respuesta JSON llega sin cambios

#### Scenario: Backend inalcanzable
- **WHEN** el backend no está escuchando y se pide `GET /api/health/ready`
- **THEN** el servidor responde con un código 5xx (502) y el sitio estático sigue respondiendo 200 en `/`

### Requirement: Destino del backend configurable al iniciar
La dirección del backend MUST tomarse de la variable de entorno `API_UPSTREAM` al iniciar el contenedor, con la forma `host:puerto` (sin `http://` ni barra final) y MUST NOT quedar escrita en la imagen, en `public/` ni en el JS. La plantilla MUST sustituir solo `API_UPSTREAM`, dejando intactas las variables propias de Nginx.

#### Scenario: Backend local desde el contenedor
- **WHEN** se ejecuta la imagen con `API_UPSTREAM=host.docker.internal:8000` y el backend escucha en `0.0.0.0:8000` del equipo
- **THEN** `/api/health/ready` responde 200 sin reconstruir la imagen

#### Scenario: Variables de Nginx preservadas
- **WHEN** se inicia el contenedor
- **THEN** la configuración generada contiene `proxy_pass http://<valor de API_UPSTREAM>/;` y `try_files $uri $uri/ =404;` con `$uri` sin sustituir

### Requirement: Imagen sin configuración ni secretos expuestos
La imagen MUST servir solo el contenido de `public/`: la plantilla, el Dockerfile y cualquier archivo de entorno MUST NOT ser accesibles por HTTP, y los archivos `.env`, `.env.*`, `.git`, `node_modules` y `.DS_Store` MUST quedar fuera del contexto de build.

#### Scenario: Configuración no publicada
- **WHEN** se piden `/default.conf.template`, `/Dockerfile` y `/.env`
- **THEN** cada una responde 404

#### Scenario: Archivos de entorno excluidos del build
- **WHEN** existe un `frontend/.env` local y se construye la imagen
- **THEN** ese archivo no forma parte del contexto enviado al build ni de la imagen
