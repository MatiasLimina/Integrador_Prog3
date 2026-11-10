# catalogo-libros Specification

## Purpose

Presenta el catálogo de la librería: el listado de libros con sus datos descriptivos y un buscador por título, junto con los estados de lista vacía y de búsqueda sin resultados.

## Requirements

### Requirement: Buscador por título
La vista Catálogo MUST incluir un formulario de búsqueda con `role="search"`, un campo de texto etiquetado para buscar por título y un botón "Buscar".

#### Scenario: Buscador accesible
- **WHEN** se abre la vista Catálogo
- **THEN** se ve un campo "Buscar por título" con su etiqueta y un botón "Buscar", alcanzables con Tab

### Requirement: Datos de cada libro del catálogo
Cada libro del catálogo MUST mostrar título, ISBN, precio con dos decimales, editorial y género, cada dato con su rótulo, tal como los devuelve el listado de la API. La tarjeta MUST NOT mostrar autores, que se consultan en el detalle. El botón «Ver detalle» de cada tarjeta MUST tener un nombre accesible que incluya el título del libro.

#### Scenario: Libro completo
- **WHEN** se observa un libro del catálogo
- **THEN** se leen su título, ISBN, precio con dos decimales, editorial y género, cada dato con su rótulo, iguales a los de la respuesta de `GET /api/libros/`

#### Scenario: Libro con varios autores
- **WHEN** se observa en el catálogo un libro del seed con más de un autor
- **THEN** la tarjeta no lista autores, y todos ellos se leen al abrir su detalle

#### Scenario: Botón de detalle identificable
- **WHEN** un lector de pantalla lista los botones de la vista Catálogo
- **THEN** cada botón «Ver detalle» anuncia el título del libro al que corresponde

### Requirement: Libro sin género
Un libro cuyo `genero` llega como `null` desde la API MUST mostrar «Sin clasificar» en el lugar del género, tanto en la tarjeta como en el detalle.

#### Scenario: Libro sin clasificar
- **WHEN** se observa el libro del seed que no tiene género («Antología de la literatura fantástica»)
- **THEN** su género se muestra como «Sin clasificar» en la tarjeta y en el detalle

### Requirement: Estados del catálogo

La vista Catálogo MUST tener en el HTML, ocultos por defecto, un mensaje de carga y uno de catálogo vacío y uno de búsqueda sin resultados (`role="status"`), y uno de error de conexión (`role="alert"`). MUST verse como máximo un estado a la vez, y la lista solo con resultados: carga durante la petición; vacío si no hay libros sin filtro en `offset=0`; sin resultados si hay filtro y no hay coincidencias; error si la petición falla.

#### Scenario: Mensajes del catálogo
- **WHEN** se inspecciona el HTML de la vista Catálogo
- **THEN** existen los mensajes de carga, catálogo vacío y búsqueda sin resultados con `hidden` y `role="status"`, y el de error con `hidden` y `role="alert"`

#### Scenario: Cargando
- **WHEN** la petición del listado está en curso (por ejemplo, con la red limitada a «3G lenta» en las herramientas del navegador)
- **THEN** se ve el mensaje de carga, los demás mensajes están ocultos y los controles de paginación están deshabilitados

#### Scenario: Búsqueda sin coincidencias
- **WHEN** se busca `zzz`
- **THEN** se muestra el mensaje de búsqueda sin resultados, la lista queda oculta y los mensajes de vacío, carga y error permanecen ocultos

#### Scenario: Búsqueda vacía
- **WHEN** el buscador está vacío o solo contiene espacios
- **THEN** se muestra la primera página del catálogo completo y todos los mensajes quedan ocultos

#### Scenario: Limpiar una búsqueda sin coincidencias
- **WHEN** se borra el texto de una búsqueda que no tenía resultados
- **THEN** la lista vuelve a mostrar la primera página del catálogo y todos los mensajes quedan ocultos

#### Scenario: Catálogo sin libros
- **WHEN** la API devuelve una lista vacía para el listado sin filtro en `offset=0`
- **THEN** se muestra el mensaje de catálogo vacío, los demás mensajes permanecen ocultos y la lista queda oculta

#### Scenario: Error de conexión
- **WHEN** el backend está detenido y se abre o se recarga el Catálogo
- **THEN** se muestra el mensaje de error de conexión con un botón «Reintentar», la lista queda oculta y los mensajes de vacío y sin resultados permanecen ocultos

#### Scenario: Reintentar tras recuperar la conexión
- **WHEN** se vuelve a levantar el backend y se presiona «Reintentar»
- **THEN** se repite la última consulta (mismo filtro, `limit` y `offset`) y se muestran sus resultados

### Requirement: Filtro por título

El buscador MUST enviar el texto como parámetro `titulo` de `GET /api/libros/`, recortando los espacios de los extremos y omitiéndolo si queda vacío; la coincidencia parcial sin distinguir mayúsculas la resuelve el backend. Cambiar el filtro MUST reiniciar `offset` a 0. El filtro MUST aplicarse al escribir y al enviar el formulario (con `preventDefault`), y solo la respuesta de la última consulta MUST mostrarse.

#### Scenario: Mayúsculas y coincidencia parcial
- **WHEN** se escribe `ALEPH` en el buscador
- **THEN** se pide `titulo=ALEPH` y se muestra el libro cuyo título contiene «Aleph»

#### Scenario: Espacios en los extremos
- **WHEN** se escribe `  rayuela  ` en el buscador
- **THEN** se pide `titulo=rayuela` y el resultado es el mismo que con `rayuela`

#### Scenario: Envío del formulario
- **WHEN** se envía el buscador con el botón "Buscar" o con Enter
- **THEN** la página no se recarga y el filtro se aplica igual

#### Scenario: Filtro reinicia la paginación
- **WHEN** estando en una página con `offset` mayor que 0 se cambia el texto de búsqueda
- **THEN** la nueva petición usa `offset=0`

#### Scenario: Escritura rápida
- **WHEN** se escribe rápidamente `ray` y la respuesta de una consulta anterior llega después de la de la última
- **THEN** la lista muestra el resultado correspondiente a `ray` y no el de la consulta anterior

### Requirement: Inserción segura de texto

Todo valor proveniente de la API o escrito por el usuario MUST insertarse en el DOM como texto. La implementación MUST NOT usar `innerHTML` para insertar datos.

#### Scenario: Texto con caracteres especiales
- **WHEN** un título devuelto por la API contiene `<`, `&` o comillas
- **THEN** el carácter se muestra literalmente como texto en la tarjeta y en el detalle, y no se interpreta como marcado

#### Scenario: Mensaje del servidor como texto
- **WHEN** se muestra un mensaje obtenido de `detail`
- **THEN** se inserta como texto, sin interpretar marcado

### Requirement: Responsabilidades reconocibles en el código del catálogo

El código de la vista Catálogo MUST separar en unidades claramente identificables la comunicación con la API (en el cliente HTTP compartido), el estado de la consulta (filtro, `limit`, `offset`), el renderizado del listado, del detalle y de sus mensajes, y los manejadores de eventos, de modo que un revisor pueda ubicar cada responsabilidad sin recorrer todo el archivo.

#### Scenario: Revisión de responsabilidades
- **WHEN** se revisa el código JavaScript de la vista Catálogo
- **THEN** las peticiones `fetch` están solo en el cliente HTTP compartido, y en el catálogo se identifican por separado el estado de la consulta, la construcción del listado y del detalle con sus mensajes, y la suscripción a los eventos del buscador, la paginación y el detalle

### Requirement: Catálogo cargado desde la API
Al abrir la vista Catálogo, JavaScript MUST pedir el listado a `GET /api/libros/` con `limit` y `offset` y generar una tarjeta por libro recibido, en el orden de la respuesta, reutilizando el molde de tarjeta del HTML. El HTML MUST NOT traer libros de ejemplo escritos a mano y la vista MUST NOT leer libros de datos locales ni de `localStorage`.

#### Scenario: Primera carga
- **WHEN** con el backend activo y el seed cargado se abre `http://127.0.0.1:8080/`
- **THEN** la pestaña Red muestra `GET /api/libros/?limit=20&offset=0` con 200 y la lista tiene una tarjeta por cada libro de la respuesta

#### Scenario: Sin datos locales
- **WHEN** se inspecciona `index.html`
- **THEN** no carga `datos.js` ni `persistencia.js` y la lista del catálogo no contiene tarjetas escritas en el marcado

#### Scenario: Cambio en la base reflejado
- **WHEN** se modifica el título de un libro por la API (`PATCH /libros/{id}`) y se recarga el Catálogo
- **THEN** la tarjeta muestra el título nuevo

### Requirement: Paginación del catálogo
El Catálogo MUST paginar con `limit` y `offset`: un selector «Libros por página» con valores entre 1 y 100 y 20 por defecto, botones «Anterior» y «Siguiente», y un indicador del rango mostrado. «Anterior» MUST estar deshabilitado en `offset = 0`; «Siguiente» MUST estar deshabilitado cuando la página recibida trae menos libros que `limit`.

#### Scenario: Avanzar y retroceder
- **WHEN** con el seed cargado se eligen 2 libros por página y se presiona «Siguiente» y luego «Anterior»
- **THEN** se piden `limit=2&offset=2` y luego `limit=2&offset=0`, y cada vez se muestran los libros de esa página con el rango actualizado

#### Scenario: Primera página
- **WHEN** se muestra la página con `offset=0`
- **THEN** «Anterior» está deshabilitado

#### Scenario: Página incompleta
- **WHEN** la respuesta trae menos libros que el `limit` pedido
- **THEN** «Siguiente» está deshabilitado

#### Scenario: Cambio de tamaño de página
- **WHEN** estando en una página con `offset` mayor que 0 se cambia «Libros por página»
- **THEN** la nueva petición usa el nuevo `limit` y `offset=0`

### Requirement: Fin del listado al paginar
Si al presionar «Siguiente» la API devuelve una página vacía, el Catálogo MUST conservar la página anterior visible con su `offset`, deshabilitar «Siguiente» e informar que no hay más libros, sin mostrar el estado de catálogo vacío ni el de búsqueda sin coincidencias.

#### Scenario: Cantidad exacta de libros
- **WHEN** hay exactamente 4 libros, se eligen 2 por página, se avanza a la segunda página y se presiona «Siguiente»
- **THEN** se siguen viendo los libros de la segunda página, «Siguiente» queda deshabilitado y se lee un aviso de que no hay más libros

### Requirement: Detalle de libro con autores
Cada tarjeta MUST ofrecer un botón «Ver detalle» que pide `GET /api/libros/{id}` y muestra, en una sección de detalle de la misma vista, título, ISBN, precio, stock, editorial, género («Sin clasificar» si es `null`) y los autores con su rol, en orden ascendente de `orden`. Al mostrarse, el foco MUST pasar al encabezado del detalle.

#### Scenario: Libro con varios autores
- **WHEN** se presiona «Ver detalle» en un libro del seed con más de un autor
- **THEN** la sección de detalle lista todos sus autores, cada uno con su rol, en el orden indicado por `orden`

#### Scenario: Libro sin autores
- **WHEN** se abre el detalle de un libro cuya lista `autores` llega vacía
- **THEN** el detalle informa que el libro no tiene autores registrados

#### Scenario: Cerrar el detalle
- **WHEN** se presiona «Cerrar detalle»
- **THEN** la sección de detalle se oculta y el foco vuelve al botón «Ver detalle» que la abrió

### Requirement: Estados del detalle de libro
Mientras se pide el detalle, la sección MUST mostrar un mensaje de carga. Si la petición falla, MUST mostrar el mensaje de error (`role="alert"`) con el texto obtenido del servidor o el de fallo de conexión, sin datos de un libro anterior.

#### Scenario: Libro inexistente
- **WHEN** el libro dejó de existir después de cargar el listado (por ejemplo, se creó un libro de prueba, se cargó el Catálogo y se volvió a correr `python -m scripts.seed`) y se presiona su «Ver detalle»
- **THEN** la sección muestra «El libro no existe.» y ningún dato de otro libro

#### Scenario: Detalle sin conexión
- **WHEN** el backend está detenido y se presiona «Ver detalle»
- **THEN** la sección muestra el mensaje de fallo de conexión
