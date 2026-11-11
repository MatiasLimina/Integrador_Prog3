# registro-clientes Specification

## Purpose

Permite registrar clientes nuevos con nombre completo y email, y consultar el listado de clientes registrados.

## Requirements

### Requirement: Formulario de alta de cliente
La vista Clientes MUST incluir un formulario de alta con un campo etiquetado "Nombre completo" (un único campo, sin apellido separado), un campo etiquetado "Email" de tipo email y un botón de envío "Registrar cliente".

#### Scenario: Campos del cliente
- **WHEN** se abre la vista Clientes
- **THEN** el formulario muestra "Nombre completo" y "Email" con sus etiquetas y el botón "Registrar cliente"

### Requirement: Listado de clientes registrados

La vista Clientes MUST mostrar una tabla de clientes registrados con columnas ID, nombre completo y email. El listado MUST generarse con todos los clientes que devuelve la API (`GET /api/clientes/`), una fila por cliente en el orden recibido, y MUST NOT contener filas de ejemplo escritas en el HTML.

#### Scenario: Tabla de clientes
- **WHEN** con el seed cargado se abre la vista Clientes
- **THEN** la tabla lista los clientes de la API (Lucía Fernández y Tomás Ríos) con su ID, nombre y email

#### Scenario: Listado generado desde los datos
- **WHEN** se cuentan las filas visibles al abrir la vista Clientes
- **THEN** hay exactamente una fila por cada cliente que devolvió la API, sin filas de ejemplo del HTML

#### Scenario: Listado vacío
- **WHEN** la API devuelve una lista vacía de clientes
- **THEN** se muestra el mensaje de listado vacío y la tabla no muestra filas

#### Scenario: Error al cargar el listado
- **WHEN** se abre la vista Clientes con el backend detenido
- **THEN** se muestra un mensaje de error de conexión con un botón "Reintentar" y la tabla no muestra filas

### Requirement: Mensajes de la vista Clientes

La vista Clientes MUST incluir, ocultos por defecto, un mensaje de carga y uno de listado vacío con `role="status"`, un mensaje de error de carga con `role="alert"` y un botón "Reintentar", un mensaje de alta correcta con `role="status"` y un mensaje de alta rechazada con `role="alert"` ubicado junto al formulario y capaz de listar los errores.

#### Scenario: Mensajes presentes
- **WHEN** se inspecciona el HTML de la vista Clientes
- **THEN** existen los mensajes de carga, listado vacío, error de carga, alta correcta y alta rechazada, todos con `hidden`

#### Scenario: Mensaje de alta correcta
- **WHEN** se registra un cliente válido y la API responde 201
- **THEN** el mensaje de alta correcta se muestra y el de alta rechazada permanece oculto

#### Scenario: Mensaje de alta rechazada
- **WHEN** se envía el formulario con datos inválidos o la API rechaza el alta
- **THEN** el mensaje de alta rechazada se muestra junto al formulario y el de alta correcta permanece oculto

#### Scenario: Errores como texto
- **WHEN** el mensaje de alta rechazada lista los errores, incluidos los mensajes devueltos por el servidor
- **THEN** cada error se muestra como texto literal en un ítem propio, sin interpretarse como marcado

### Requirement: Validación de los campos obligatorios del cliente

El alta de cliente MUST rechazarse si el nombre completo o el email están vacíos, considerando vacío un valor que solo contiene espacios. La comprobación MUST hacerse en JavaScript al enviar el formulario.

#### Scenario: Nombre vacío
- **WHEN** se envía el formulario con el nombre completo vacío o solo con espacios y el resto de los datos válidos
- **THEN** el alta se rechaza y se muestra un error que indica que el nombre completo es obligatorio

#### Scenario: Email vacío
- **WHEN** se envía el formulario con el email vacío o solo con espacios y el resto de los datos válidos
- **THEN** el alta se rechaza y se muestra un error que indica que el email es obligatorio

### Requirement: Validación del formato del email

El email MUST tener un formato válido, con una parte local y un dominio separados por una arroba y un dominio con al menos un punto. La validación MUST aplicarse sobre el valor sin espacios exteriores.

#### Scenario: Email sin arroba
- **WHEN** se envía un email sin arroba
- **THEN** el alta se rechaza y se muestra un error que indica que el email no tiene un formato válido

#### Scenario: Email sin dominio completo
- **WHEN** se envía un email con una arroba pero sin un dominio con punto
- **THEN** el alta se rechaza y se muestra un error que indica que el email no tiene un formato válido

#### Scenario: Email con espacios exteriores
- **WHEN** se envía un email válido rodeado de espacios
- **THEN** el formato se valida sobre el valor sin los espacios exteriores y no se produce un error de formato

### Requirement: Alta efectiva de cliente

Solo un alta que supera todas las validaciones del navegador MUST enviarse con `POST /api/clientes/` y el cuerpo `{nombre, email}`, sin otros campos: el valor de "Nombre completo" MUST enviarse como `nombre`. El nombre y el email MUST enviarse sin espacios exteriores. El cliente queda registrado solo cuando la API responde 201.

#### Scenario: Alta correcta
- **WHEN** se envían datos válidos de un cliente nuevo
- **THEN** la pestaña Red muestra un único `POST /api/clientes/` con exactamente `nombre` y `email`, la API responde 201 y el cliente aparece en el listado

#### Scenario: Alta rechazada
- **WHEN** se envían datos que incumplen al menos una validación del navegador
- **THEN** no se hace ninguna petición `POST` y el listado no cambia

#### Scenario: Persistencia en la base
- **WHEN** tras un alta correcta se recarga la vista Clientes
- **THEN** el cliente registrado sigue en el listado, porque lo devuelve la API

### Requirement: Actualización del listado de clientes sin recargar

Tras un alta correcta, la página MUST NOT recargarse, el listado de clientes MUST reflejar el nuevo registro usando el cliente que devolvió la API en la respuesta 201 y el mensaje de alta correcta MUST informar el identificador asignado por la API.

#### Scenario: Listado actualizado
- **WHEN** se registra un cliente válido
- **THEN** el listado muestra el cliente nuevo con el ID de la respuesta 201, en la misma página, sin recargar ni navegar

#### Scenario: ID informado
- **WHEN** se registra un cliente válido y la API le asigna el ID 3
- **THEN** el mensaje de alta correcta indica que el cliente se registró con ID 3

#### Scenario: Formulario limpio
- **WHEN** se registra un cliente válido
- **THEN** los campos de nombre completo y email quedan vacíos

### Requirement: Estados del formulario de alta de cliente

El formulario MUST mostrar como máximo un mensaje de resultado a la vez: el de alta correcta o el de alta rechazada. El mensaje de error MUST listar un ítem por cada error detectado y la lista de errores MUST vaciarse antes de cada intento. Los mensajes MUST conservar sus roles de estado y alerta y su visibilidad MUST controlarse con el atributo `hidden`.

#### Scenario: Errores listados
- **WHEN** se envía un formulario con varios datos inválidos
- **THEN** el mensaje de error queda visible con un ítem por cada error y el mensaje de alta correcta queda oculto

#### Scenario: Reintento
- **WHEN** se vuelve a enviar el formulario después de un intento fallido
- **THEN** la lista de errores anterior se vacía antes de mostrar el resultado del nuevo intento

#### Scenario: Éxito sin errores visibles
- **WHEN** se registra un cliente válido
- **THEN** el mensaje de alta correcta queda visible, el de error queda oculto y la lista de errores queda vacía

#### Scenario: Envío en curso
- **WHEN** se envía un cliente válido y la API todavía no respondió
- **THEN** el botón "Registrar cliente" está deshabilitado, y vuelve a habilitarse al llegar la respuesta, sea éxito o error

### Requirement: Rechazo del alta de cliente por la API
Cuando la API rechaza el alta, la vista MUST mostrar en el mensaje de alta rechazada el código recibido y el mensaje del servidor (texto de `detail`, o los mensajes de la lista 422) y MUST conservar los datos escritos. La unicidad del email MUST decidirla la API.

#### Scenario: Email repetido
- **WHEN** se registra un cliente con el email de un cliente existente, escrito exactamente igual
- **THEN** la API responde 409, se muestra «Ya existe un cliente con ese email.» y el formulario conserva lo escrito

#### Scenario: Email rechazado por el servidor
- **WHEN** se envía un email que pasa el formato del navegador pero la API responde 422
- **THEN** se muestra el mensaje de validación del servidor como texto, sin el JSON crudo

#### Scenario: Sin conexión al enviar
- **WHEN** se envía un cliente válido con el backend detenido
- **THEN** se muestra el mensaje de fallo de conexión y el formulario conserva lo escrito

### Requirement: Consulta de cliente por ID
La vista Clientes MUST incluir un formulario "Buscar cliente por ID" con un campo etiquetado "ID del cliente" y un botón "Buscar". Al enviarlo con un entero entre 1 y 2147483647 MUST consultar `GET /api/clientes/{id}` y mostrar el ID, el nombre y el email devueltos como texto; con un valor fuera de ese rango MUST mostrar un error sin consultar la API.

#### Scenario: Cliente recuperado por ID
- **WHEN** se registra un cliente, se escribe el ID informado en "ID del cliente" y se presiona "Buscar"
- **THEN** la pestaña Red muestra `GET /api/clientes/{id}` con 200 y se muestran el ID, el nombre y el email de ese cliente

#### Scenario: Cliente inexistente
- **WHEN** se busca un ID que no corresponde a ningún cliente
- **THEN** la API responde 404 y se muestra «El cliente no existe.» con `role="alert"`, sin datos de un cliente anterior

#### Scenario: ID inválido
- **WHEN** se busca con el campo vacío, `0`, `-3` o `2.5`
- **THEN** no se consulta la API y se muestra un error que indica que el ID debe ser un entero mayor o igual que 1

#### Scenario: Sin conexión al buscar
- **WHEN** se busca un ID con el backend detenido
- **THEN** se muestra el mensaje de fallo de conexión
