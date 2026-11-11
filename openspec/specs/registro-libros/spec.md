# registro-libros Specification

## Purpose

Permite registrar libros nuevos con sus relaciones (editorial, género opcional y uno o más autores) y consultar el listado de libros registrados.

## Requirements

### Requirement: Campos del formulario de alta de libro
La vista Libros MUST incluir un formulario de alta con campos etiquetados para título, ISBN, precio y stock, y un botón de envío "Registrar libro". El campo "Stock" MUST aceptar números enteros y MUST NOT tener un valor precargado.

#### Scenario: Campos básicos
- **WHEN** se abre la vista Libros
- **THEN** el formulario muestra los campos "Título", "ISBN", "Precio" y "Stock" con sus etiquetas y el botón "Registrar libro"

#### Scenario: Stock sin valor inicial
- **WHEN** se abre la vista Libros o se registra un libro correctamente
- **THEN** el campo "Stock" está vacío

### Requirement: Selección de editorial

El formulario de libro MUST ofrecer la editorial mediante un selector cuyas opciones MUST generarse con todas las editoriales que devuelve la API (`GET /api/editoriales/`). La primera opción MUST invitar a elegir y MUST NOT seleccionar ninguna editorial.

#### Scenario: Editorial sin elegir
- **WHEN** se abre la vista Libros
- **THEN** el selector "Editorial" muestra una opción inicial que invita a elegir, seguida de las editoriales de la API

#### Scenario: Editoriales generadas desde los datos
- **WHEN** con el seed cargado se inspeccionan las opciones del selector "Editorial"
- **THEN** hay una opción por cada editorial de la API (Sudamericana, Alfaguara y Emecé), con su nombre como texto y su identificador como valor, y ninguna opción de los datos locales

### Requirement: Selección de género opcional

El formulario de libro MUST ofrecer el género mediante un selector cuyas opciones MUST generarse con todos los géneros que devuelve la API (`GET /api/generos/`) e incluir la opción «Sin clasificar», que representa la ausencia de género y es la opción inicial con valor vacío.

#### Scenario: Opción Sin clasificar
- **WHEN** se despliega el selector "Género"
- **THEN** la primera opción es «Sin clasificar», con valor vacío, seguida de los géneros de la API

#### Scenario: Géneros generados desde los datos
- **WHEN** con el seed cargado se inspeccionan las opciones del selector "Género"
- **THEN** hay una opción por cada género de la API (Novela, Cuento y Ensayo), con su nombre como texto y su identificador como valor

### Requirement: Listado de libros registrados

La vista Libros MUST mostrar una tabla de libros registrados con columnas título, ISBN, editorial, género, precio y stock. El listado MUST generarse con todos los libros que devuelve la API (`GET /api/libros/`), una fila por libro en el orden recibido, y MUST NOT contener filas de ejemplo escritas en el HTML.

#### Scenario: Tabla de libros
- **WHEN** con el seed cargado se abre la vista Libros
- **THEN** la tabla lista los 4 libros de la API, incluida «Antología de la literatura fantástica» con género «Sin clasificar»

#### Scenario: Listado generado desde los datos
- **WHEN** se cuentan las filas visibles al abrir la vista Libros
- **THEN** hay exactamente una fila por cada libro que devolvió la API, sin filas de ejemplo del HTML

#### Scenario: Presentación de los campos
- **WHEN** se revisa una fila del listado
- **THEN** el género ausente se muestra como «Sin clasificar», el precio se muestra con dos decimales tal como lo devuelve la API y el stock como entero

#### Scenario: Listado vacío
- **WHEN** la API devuelve una lista vacía de libros
- **THEN** se muestra el mensaje de listado vacío y la tabla no muestra filas

#### Scenario: Error al cargar el listado
- **WHEN** se abre la vista Libros con el backend detenido
- **THEN** se muestra un mensaje de error de conexión con un botón "Reintentar" y la tabla no muestra filas

### Requirement: Mensajes de la vista Libros

La vista Libros MUST incluir, ocultos por defecto, un mensaje de carga y uno de listado vacío con `role="status"`, un mensaje de error de carga con `role="alert"` y un botón "Reintentar", un mensaje de alta correcta con `role="status"` y un mensaje de alta rechazada con `role="alert"` ubicado junto al formulario y capaz de listar los errores.

#### Scenario: Mensajes presentes
- **WHEN** se inspecciona el HTML de la vista Libros
- **THEN** existen los mensajes de carga, listado vacío, error de carga, alta correcta y alta rechazada, todos con `hidden`

#### Scenario: Mensaje de alta correcta
- **WHEN** se registra un libro válido y la API responde 201
- **THEN** el mensaje de alta correcta se muestra y el de alta rechazada permanece oculto

#### Scenario: Mensaje de alta rechazada
- **WHEN** se envía el formulario con datos inválidos o la API rechaza el alta
- **THEN** el mensaje de alta rechazada se muestra junto al formulario y el de alta correcta permanece oculto

#### Scenario: Errores como texto
- **WHEN** el mensaje de alta rechazada lista los errores, incluidos los mensajes devueltos por el servidor
- **THEN** cada error se muestra como texto literal en un ítem propio, sin interpretarse como marcado

### Requirement: Validación de campos obligatorios del libro

El alta de libro MUST rechazarse si el título o el ISBN están vacíos, considerando vacío un valor que solo contiene espacios. La comprobación MUST hacerse en JavaScript al enviar el formulario.

#### Scenario: Título vacío
- **WHEN** se envía el formulario con el título vacío o solo con espacios y el resto de los datos válidos
- **THEN** el alta se rechaza y se muestra un error que indica que el título es obligatorio

#### Scenario: ISBN vacío
- **WHEN** se envía el formulario con el ISBN vacío o solo con espacios y el resto de los datos válidos
- **THEN** el alta se rechaza y se muestra un error que indica que el ISBN es obligatorio

### Requirement: Validación del precio

El precio MUST ser un número mayor que cero con hasta dos decimales y como máximo 99999999.99. Un valor vacío MUST rechazarse como error de precio y MUST NOT interpretarse como cero.

#### Scenario: Precio vacío
- **WHEN** se envía el formulario con el precio vacío
- **THEN** el alta se rechaza y se muestra un error que indica que el precio es obligatorio

#### Scenario: Precio no numérico
- **WHEN** se envía un precio que no representa un número
- **THEN** el alta se rechaza y se muestra un error que indica que el precio debe ser un número

#### Scenario: Precio menor o igual que cero
- **WHEN** se envía un precio numérico igual o menor que cero
- **THEN** el alta se rechaza y se muestra un error que indica que el precio debe ser mayor que cero

#### Scenario: Precio con más de dos decimales
- **WHEN** se envía el precio `10.555`
- **THEN** el alta se rechaza sin llamar a la API y se muestra un error que indica que el precio admite hasta dos decimales

#### Scenario: Precio demasiado grande
- **WHEN** se envía el precio `100000000`
- **THEN** el alta se rechaza sin llamar a la API y se muestra un error que indica el máximo admitido

#### Scenario: Precio válido
- **WHEN** se envía un precio numérico mayor que cero con hasta dos decimales
- **THEN** la validación del precio no produce errores

### Requirement: Validación de editorial y autores

El libro MUST tener una editorial elegida y al menos una autoría. Ambas comprobaciones MUST hacerse en el navegador antes de enviar, porque la API acepta un libro sin autorías. La existencia de la editorial y de los autores la MUST decidir la API: si alguno no existe responde 409 y se muestra su mensaje.

#### Scenario: Editorial sin elegir
- **WHEN** se envía el formulario sin elegir editorial
- **THEN** el alta se rechaza sin llamar a la API y se muestra un error que indica que se debe elegir una editorial

#### Scenario: Sin autores seleccionados
- **WHEN** se envía el formulario sin ninguna autoría agregada
- **THEN** el alta se rechaza sin llamar a la API y se muestra un error que indica que se debe agregar al menos un autor

#### Scenario: Editorial inexistente
- **WHEN** el cuerpo enviado referencia una editorial que ya no existe en la base
- **THEN** la API responde 409 y el mensaje de alta rechazada muestra «La editorial indicada no existe.»

#### Scenario: Autor inexistente
- **WHEN** el cuerpo enviado referencia un autor que ya no existe en la base
- **THEN** la API responde 409 y el mensaje de alta rechazada muestra «Uno de los autores indicados no existe.»

### Requirement: Validación del género opcional

El género MUST ser opcional. Cuando no se elige ninguno («Sin clasificar») MUST enviarse `genero_id` en `null` y el libro MUST registrarse sin género. Cuando se elige uno, MUST enviarse su identificador; si ya no existe, la API responde 409 y se muestra su mensaje.

#### Scenario: Género sin clasificar
- **WHEN** se envía el formulario con la opción «Sin clasificar» y el resto de los datos válidos
- **THEN** el cuerpo enviado lleva `"genero_id": null`, la API responde 201 y el libro registrado no tiene género

#### Scenario: Género inexistente
- **WHEN** el cuerpo enviado referencia un género que ya no existe en la base
- **THEN** la API responde 409 y el mensaje de alta rechazada muestra «El género indicado no existe.»

### Requirement: Alta efectiva de libro

Solo un alta que supera todas las validaciones del navegador MUST enviarse con `POST /api/libros/`, con el cuerpo `{isbn, titulo, precio, stock, editorial_id, genero_id, autores: [{autor_id, rol, orden}]}` y sin otros campos. El título y el ISBN MUST enviarse sin espacios exteriores. El libro queda registrado solo cuando la API responde 201.

#### Scenario: Alta correcta
- **WHEN** se envían datos válidos de un libro nuevo con stock 5, género «Sin clasificar» y dos autorías
- **THEN** la pestaña Red muestra un único `POST /api/libros/` con ese cuerpo, la API responde 201 y el libro aparece en el listado

#### Scenario: Alta rechazada
- **WHEN** se envían datos que incumplen al menos una validación del navegador
- **THEN** no se hace ninguna petición `POST` y el listado no cambia

#### Scenario: Persistencia en la base
- **WHEN** tras un alta correcta se recarga la vista Libros
- **THEN** el libro registrado sigue en el listado, porque lo devuelve la API

### Requirement: Actualización del listado y de los selectores sin recargar

Tras un alta correcta, la página MUST NOT recargarse y el listado de libros MUST reflejar el nuevo registro usando el libro que devolvió la API en la respuesta 201, sin volver a pedir el listado. El formulario MUST quedar limpio.

#### Scenario: Listado actualizado
- **WHEN** se registra un libro válido
- **THEN** el listado muestra el libro nuevo en la misma página, con los datos de la respuesta 201, sin recargar ni navegar

#### Scenario: Formulario limpio
- **WHEN** se registra un libro válido
- **THEN** el formulario vuelve a mostrar la editorial y el género sin elegir, la lista de autorías vacía y los campos de texto y números vacíos

### Requirement: Estados del formulario de alta de libro

El formulario MUST mostrar como máximo un mensaje de resultado a la vez: el de alta correcta o el de alta rechazada. El mensaje de error MUST listar un ítem por cada error detectado y la lista de errores MUST vaciarse antes de cada intento. Los mensajes MUST conservar sus roles de estado y alerta y su visibilidad MUST controlarse con el atributo `hidden`.

#### Scenario: Errores listados
- **WHEN** se envía un formulario con varios datos inválidos
- **THEN** el mensaje de error queda visible con un ítem por cada error y el mensaje de alta correcta queda oculto

#### Scenario: Reintento
- **WHEN** se vuelve a enviar el formulario después de un intento fallido
- **THEN** la lista de errores anterior se vacía antes de mostrar el resultado del nuevo intento

#### Scenario: Éxito sin errores visibles
- **WHEN** se registra un libro válido
- **THEN** el mensaje de alta correcta queda visible, el de error queda oculto y la lista de errores queda vacía

#### Scenario: Envío en curso
- **WHEN** se envía un libro válido y la API todavía no respondió
- **THEN** el botón "Registrar libro" está deshabilitado, y vuelve a habilitarse al llegar la respuesta, sea éxito o error

### Requirement: Validación del stock
El stock MUST ser un número entero mayor o igual que cero y como máximo 2147483647. Un valor vacío MUST rechazarse como error de stock y MUST NOT interpretarse como cero.

#### Scenario: Stock vacío
- **WHEN** se envía el formulario con el stock vacío
- **THEN** el alta se rechaza sin llamar a la API y se muestra un error que indica que el stock es obligatorio

#### Scenario: Stock no entero
- **WHEN** se envía el stock `2.5` o un texto no numérico
- **THEN** el alta se rechaza y se muestra un error que indica que el stock debe ser un número entero

#### Scenario: Stock negativo
- **WHEN** se envía el stock `-1`
- **THEN** el alta se rechaza y se muestra un error que indica que el stock no puede ser negativo

#### Scenario: Stock cero válido
- **WHEN** se envía el stock `0` con el resto de los datos válidos
- **THEN** la validación del stock no produce errores y el cuerpo enviado lleva `"stock": 0`

### Requirement: Editor de autorías
El formulario MUST incluir, en un `<fieldset>` con leyenda que indique que se requiere al menos un autor, un selector "Autor" con todos los autores que devuelve la API (`GET /api/autores/`), un selector "Rol" con autor, coautor, traductor e ilustrador, un campo "Orden" y un botón "Agregar autoría". Las autorías agregadas MUST listarse en orden ascendente de `orden` con el nombre del autor, el rol y el orden, cada una con un botón "Quitar" cuyo nombre accesible identifique al autor.

#### Scenario: Autores desde la API
- **WHEN** con el seed cargado se despliega el selector "Autor"
- **THEN** hay una opción inicial que invita a elegir seguida de los 5 autores de la API, con su nombre como texto y su identificador como valor

#### Scenario: Agregar dos autorías
- **WHEN** se agrega Jorge Luis Borges como autor con orden 1 y Adolfo Bioy Casares como coautor con orden 2
- **THEN** la lista muestra ambas autorías en ese orden, con nombre, rol y orden escritos como texto

#### Scenario: Orden sugerido
- **WHEN** se agrega una autoría
- **THEN** el campo "Orden" pasa a sugerir el siguiente número libre (mayor orden agregado más uno)

#### Scenario: Quitar una autoría
- **WHEN** se presiona "Quitar" en una autoría de la lista
- **THEN** esa autoría deja de figurar y no se envía en el alta

### Requirement: Validación de cada autoría
Al presionar "Agregar autoría", el navegador MUST exigir un autor elegido, un rol de los cuatro permitidos y un orden entero entre 1 y 2147483647, y MUST rechazar un autor que ya figura en la lista. Una autoría rechazada MUST NOT agregarse y su error MUST mostrarse junto al editor de autorías.

#### Scenario: Autor sin elegir
- **WHEN** se presiona "Agregar autoría" sin elegir autor
- **THEN** no se agrega ninguna autoría y se muestra un error que indica que se debe elegir un autor

#### Scenario: Orden inválido
- **WHEN** se presiona "Agregar autoría" con orden `0`, `1.5` o vacío
- **THEN** no se agrega la autoría y se muestra un error que indica que el orden debe ser un entero mayor o igual que 1

#### Scenario: Autor repetido
- **WHEN** se intenta agregar un autor que ya figura en la lista de autorías
- **THEN** no se agrega y se muestra un error que indica que ese autor ya está en el libro

### Requirement: Libro registrado devuelto por la API
Tras una respuesta 201, la vista Libros MUST mostrar junto al formulario el libro que devolvió la API: su identificador, título, ISBN, precio, stock, editorial, género («Sin clasificar» si es `null`) y sus autorías con nombre, rol y orden. Todos los valores MUST insertarse como texto.

#### Scenario: Detalle del libro registrado
- **WHEN** se registra un libro con stock 5, sin género y dos autorías
- **THEN** se muestra el identificador asignado por la API, el stock 5, el género «Sin clasificar» y las dos autorías en orden

#### Scenario: Coincidencia con la consulta por ID
- **WHEN** después del alta se abre el detalle de ese libro en el Catálogo (`GET /api/libros/{id}`)
- **THEN** los datos coinciden con los mostrados tras el alta

### Requirement: Rechazo del alta de libro por la API
Cuando la API rechaza el alta, la vista MUST mostrar en el mensaje de alta rechazada el código recibido y el mensaje del servidor (texto de `detail`, o los mensajes de la lista 422), y MUST conservar los datos escritos y las autorías agregadas. La unicidad del ISBN MUST decidirla la API.

#### Scenario: ISBN repetido
- **WHEN** se registra un libro con el ISBN de un libro existente, escrito exactamente igual
- **THEN** la API responde 409 y se muestra «Ya existe un libro con ese ISBN.», y el formulario conserva lo escrito

#### Scenario: Cuerpo inválido para la API
- **WHEN** la API responde 422 a un alta
- **THEN** se muestran los mensajes de validación del servidor como texto, sin el JSON crudo

#### Scenario: Sin conexión al enviar
- **WHEN** se envía un libro válido con el backend detenido
- **THEN** se muestra el mensaje de fallo de conexión y el formulario conserva lo escrito

### Requirement: Opciones del formulario no disponibles
Si no se pueden cargar las editoriales, los géneros o los autores, la vista MUST mostrar un mensaje de error con un botón "Reintentar" y el botón "Registrar libro" MUST quedar deshabilitado hasta que las tres cargas terminen bien.

#### Scenario: Backend detenido al abrir
- **WHEN** se abre la vista Libros con el backend detenido
- **THEN** se informa el fallo de conexión de las opciones y "Registrar libro" está deshabilitado

#### Scenario: Reintento exitoso
- **WHEN** se vuelve a levantar el backend y se presiona "Reintentar"
- **THEN** los tres selectores se completan y "Registrar libro" se habilita
