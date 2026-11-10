# cliente-http Specification

## Purpose
Define cómo el frontend se comunica con la API de la librería: una base relativa única, las rutas exactas del backend, el intercambio en JSON y la forma en que se clasifican y se presentan los fallos de red y las respuestas con error.

## Requirements

### Requirement: Base relativa única de la API
Toda petición del frontend a la API MUST dirigirse al mismo origen del sitio, con la base relativa `/api` seguida de la ruta del backend. La base MUST definirse en un solo lugar del código, y el JavaScript MUST NOT contener la URL, el host ni el puerto del backend.

#### Scenario: Petición bajo el origen del sitio
- **WHEN** se abre el Catálogo en `http://127.0.0.1:8080` y se observa la pestaña Red de las herramientas del navegador
- **THEN** la petición de libros va a `http://127.0.0.1:8080/api/libros/` (con su query) y no a otro host ni puerto

#### Scenario: Sin dirección del backend en el código
- **WHEN** se buscan `localhost`, `127.0.0.1`, `:8000`, `http://` y `https://` en los archivos de `frontend/public/js/`
- **THEN** no hay coincidencias usadas para armar peticiones, y la cadena `/api` aparece definida una sola vez

### Requirement: Rutas exactas del backend
Cada petición MUST usar la ruta exactamente como la declara el backend: las rutas de colección con su barra final (`/libros/`) y las de un recurso sin barra final (`/libros/{id}`), de modo que el backend responda sin redirecciones.

#### Scenario: Listado sin redirección
- **WHEN** el Catálogo pide el listado de libros
- **THEN** la petición es `GET /api/libros/?…` y la respuesta es 200, sin ninguna respuesta 307 previa en la pestaña Red

#### Scenario: Recurso individual sin redirección
- **WHEN** se abre el detalle del libro con id 1
- **THEN** la petición es `GET /api/libros/1` y la respuesta es 200 sin redirección

### Requirement: Parámetros de consulta codificados
Los parámetros de consulta MUST enviarse codificados para URL, y un parámetro sin valor (vacío o ausente) MUST omitirse de la query en lugar de enviarse vacío.

#### Scenario: Texto con caracteres especiales
- **WHEN** se busca un título con espacios, tildes o `&`
- **THEN** la query lleva el texto codificado y el backend lo recibe literal, sin cortar la búsqueda en el `&`

#### Scenario: Parámetro vacío omitido
- **WHEN** se pide el listado con el buscador vacío
- **THEN** la query no incluye `titulo` y sí incluye `limit` y `offset`

### Requirement: Intercambio en JSON
Cuando una petición lleva cuerpo, MUST enviarlo serializado como JSON con la cabecera `Content-Type: application/json`. Las respuestas exitosas con cuerpo JSON MUST entregarse ya interpretadas a quien hizo la petición.

#### Scenario: Envío con cuerpo
- **WHEN** desde la consola del navegador se usa el cliente para enviar `POST /libros/` con un cuerpo vacío `{}`
- **THEN** la pestaña Red muestra `Content-Type: application/json` y el cuerpo `{}`, y el backend responde 422 sin crear ningún libro

#### Scenario: Respuesta interpretada
- **WHEN** el backend responde 200 con una lista JSON
- **THEN** quien pidió recibe la lista como datos, sin tener que interpretar el texto

### Requirement: Fallo de red distinguido
Cuando la petición no obtiene respuesta (servidor inalcanzable, red caída), el cliente MUST informar un fallo de conexión distinguible de una respuesta HTTP con error, con un mensaje legible en español y sin texto técnico del navegador.

#### Scenario: Sitio sin red
- **WHEN** con el sitio ya abierto se detiene el contenedor Nginx (o se activa «Sin conexión» en las herramientas del navegador) y se repite la búsqueda
- **THEN** se informa un fallo de conexión con un mensaje en español, no un error HTTP ni el texto de la excepción del navegador

### Requirement: Respuesta HTTP con error
Ante una respuesta con código fuera de 2xx, el cliente MUST informar el código y un mensaje legible: el texto de `detail` si es una cadena; los `msg` de cada elemento si `detail` es una lista (422); y un mensaje genérico según el código si el cuerpo no es JSON o no trae `detail`. Las respuestas 502, 503 y 504 MUST tratarse como fallo de conexión con el servidor.

#### Scenario: Detalle como texto
- **WHEN** se pide un libro que no existe y el backend responde 404 `{"detail": "El libro no existe."}`
- **THEN** el mensaje informado es «El libro no existe.»

#### Scenario: Detalle como lista de validación
- **WHEN** el backend responde 422 con `detail` como lista de errores
- **THEN** el mensaje informado reúne el `msg` de cada error, sin mostrar el JSON crudo

#### Scenario: Backend caído detrás del proxy
- **WHEN** el backend está detenido y Nginx responde 502 con un cuerpo HTML
- **THEN** el cliente no falla al interpretar el cuerpo y lo informa como fallo de conexión con el servidor

### Requirement: Respuestas sin almacenamiento en el navegador
El cliente MUST NOT guardar peticiones ni respuestas de la API en `localStorage`, `sessionStorage`, cookies ni otro almacenamiento persistente del navegador; cada consulta MUST obtener los datos de la API.

#### Scenario: Almacenamiento sin datos de la API
- **WHEN** tras usar el Catálogo se revisan `localStorage` y `sessionStorage` del origen `http://127.0.0.1:8080` en las herramientas del navegador
- **THEN** no hay entradas creadas por el Catálogo ni por el cliente HTTP
