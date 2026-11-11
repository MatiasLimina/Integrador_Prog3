# venta-simulada Specification

## Purpose

Permite componer una venta: elegir un cliente cargado desde la API, agregar renglones de libros con cantidades (sin importes calculados en el navegador) y confirmarla. El borrador vive solo en memoria; la confirmación envía `POST /api/ventas/` y la venta queda registrada únicamente cuando la API responde 201, mostrando el comprobante con los importes de esa respuesta.

## Requirements

### Requirement: Selección de cliente
La vista Ventas MUST incluir un selector etiquetado "Cliente" cuyas opciones MUST generarse con todos los clientes que devuelve la API (`GET /api/clientes/`), en el orden recibido, con el nombre y el ID como texto y el ID como valor. La opción inicial MUST NOT seleccionar ningún cliente y el HTML MUST NOT traer clientes escritos a mano.

#### Scenario: Cliente sin elegir
- **WHEN** se abre la vista Ventas
- **THEN** el selector "Cliente" muestra una opción inicial que invita a elegir, seguida de los clientes de la API

#### Scenario: Clientes generados desde los datos
- **WHEN** con el seed cargado se inspeccionan las opciones del selector "Cliente"
- **THEN** hay una opción por cliente devuelto por la API (Lucía Fernández y Tomás Ríos), con su nombre e ID como texto y su ID como valor, y ninguna opción de ejemplo del HTML

#### Scenario: Cliente registrado en otra vista
- **WHEN** se registra un cliente en la vista Clientes y luego se abre la vista Ventas
- **THEN** el nuevo cliente aparece en el selector "Cliente"

### Requirement: Alta de renglón
La vista Ventas MUST incluir un selector etiquetado "Libro" con todos los libros que devuelve la API (`GET /api/libros/`), un campo numérico "Cantidad" que declare enteros de 1 a 2147483647 con valor inicial 1, y un botón "Agregar renglón". El renglón MUST guardar el ID, el título y el precio actual tal como los devuelve la API. Si el libro ya está en la venta, la cantidad MUST sumarse a su renglón.

#### Scenario: Controles de renglón
- **WHEN** se abre la vista Ventas
- **THEN** se ven el selector "Libro", el campo "Cantidad" y el botón "Agregar renglón", alcanzables con Tab

#### Scenario: Libros generados desde la API
- **WHEN** con el seed cargado se inspeccionan las opciones del selector "Libro"
- **THEN** hay una opción inicial que invita a elegir y una opción por libro devuelto por la API con su título y su precio tal como llega (por ejemplo «Rayuela — 25000.00»), sin opciones de ejemplo del HTML

#### Scenario: Renglón agregado
- **WHEN** se elige un libro y una cantidad válida y se activa "Agregar renglón"
- **THEN** aparece un renglón con el título, la cantidad y el precio actual del libro tal como lo devolvió la API

#### Scenario: Libro repetido suma cantidad
- **WHEN** se agrega un renglón con un libro que ya está en la venta
- **THEN** no se crea otro renglón: la cantidad del renglón existente se incrementa en la cantidad agregada

#### Scenario: Suma fuera de rango
- **WHEN** sumar la cantidad agregada a la del renglón existente supera 2147483647
- **THEN** el renglón conserva su cantidad anterior y se informa el error

#### Scenario: Cantidad inválida al agregar
- **WHEN** se intenta agregar un renglón sin libro elegido, o con cantidad vacía, 0, negativa, decimal o mayor que 2147483647
- **THEN** no se agrega el renglón y se informa el error

### Requirement: Tabla de renglones
La vista Ventas MUST mostrar los renglones del borrador en una tabla con columnas libro, precio actual, cantidad y acciones; cada renglón MUST tener la cantidad editable con etiqueta propia y un botón "Quitar renglón". El borrador MUST NOT calcular ni mostrar subtotales ni total.

#### Scenario: Renglón editable
- **WHEN** se observa un renglón de la venta
- **THEN** su cantidad está en un campo editable etiquetado con el título del libro y tiene un botón "Quitar renglón"

#### Scenario: Cambio de cantidad
- **WHEN** se modifica la cantidad de un renglón a un entero válido
- **THEN** el renglón conserva la nueva cantidad y sigue siendo el único renglón de ese libro

#### Scenario: Cambio de cantidad inválido
- **WHEN** se modifica la cantidad de un renglón a vacío, 0, negativa, decimal o mayor que 2147483647
- **THEN** el renglón vuelve a su cantidad anterior y se informa el error

#### Scenario: Quitar renglón
- **WHEN** se activa "Quitar renglón" de un renglón
- **THEN** el renglón desaparece del borrador y, si era el último, se muestra el mensaje de venta sin renglones

#### Scenario: Sin importes calculados en el borrador
- **WHEN** se compone una venta de 2 × Rayuela y 1 × Respiración artificial
- **THEN** la tabla del borrador no muestra subtotales ni total; solo título, precio actual y cantidad de cada renglón

### Requirement: Confirmación de la venta
La vista Ventas MUST incluir un botón "Confirmar venta". Solo una venta que supera la validación del navegador MUST enviarse con `POST /api/ventas/` y el cuerpo exacto `{cliente_id, renglones:[{libro_id, cantidad}]}`, sin otros campos, con los renglones en el orden del borrador. La venta queda registrada solo cuando la API responde 201.

#### Scenario: Botón de confirmación
- **WHEN** se recorre el formulario de venta con Tab
- **THEN** el último control del formulario es el botón "Confirmar venta"

#### Scenario: Confirmación válida
- **WHEN** se confirma una venta de Tomás Ríos con 2 × Rayuela y 1 × Respiración artificial
- **THEN** la pestaña Red muestra un único `POST /api/ventas/` con el cuerpo `{"cliente_id": 2, "renglones": [{"libro_id": 1, "cantidad": 2}, {"libro_id": 4, "cantidad": 1}]}` y la API responde 201

#### Scenario: Confirmación inválida
- **WHEN** se confirma sin cliente o sin renglones
- **THEN** no se hace ninguna petición `POST` y se listan los errores en el mensaje de venta rechazada

#### Scenario: Envío en curso
- **WHEN** se confirma una venta válida y la respuesta todavía no llegó
- **THEN** "Confirmar venta" y los controles del borrador (cliente, libro, cantidad, agregar, cantidades de renglón y quitar) están deshabilitados, y un segundo clic no genera otra petición

#### Scenario: Fin del envío
- **WHEN** llega la respuesta de la API, sea 201, un error HTTP o un fallo de conexión
- **THEN** "Confirmar venta" y los controles del borrador vuelven a estar habilitados

### Requirement: Mensajes de la vista Ventas
La vista Ventas MUST incluir, ocultos por defecto, un mensaje de venta sin renglones, uno de carga de opciones y uno de venta confirmada con `role="status"`, uno de error de carga de opciones con `role="alert"` y un botón "Reintentar", y uno de venta rechazada con `role="alert"` junto al formulario capaz de listar los errores.

#### Scenario: Mensajes presentes
- **WHEN** se inspecciona el HTML de la vista Ventas
- **THEN** existen los mensajes de venta sin renglones, carga de opciones, error de carga de opciones, venta confirmada y venta rechazada, todos con `hidden`

#### Scenario: Errores como texto
- **WHEN** el mensaje de venta rechazada lista errores, incluidos los mensajes devueltos por el servidor
- **THEN** cada error se muestra como texto literal en un ítem propio, sin interpretarse como marcado

### Requirement: Validación pura de la venta
La validación de la venta MUST ser una función pura que reciba el cliente elegido y los renglones del borrador y devuelva `{ valido, errores, cuerpo }`, donde `cuerpo` es exactamente el JSON del contrato. MUST validar cliente elegido (entero ≥ 1), al menos un renglón, libro por renglón (entero ≥ 1), cantidad entera de 1 a 2147483647 y un solo renglón por libro. MUST NOT decidir la existencia de clientes ni libros.

#### Scenario: Venta válida
- **WHEN** se valida el cliente `"2"` con los renglones libro 1 × 2 y libro 4 × 1
- **THEN** devuelve `valido: true`, `errores: []` y `cuerpo` igual a `{cliente_id: 2, renglones: [{libro_id: 1, cantidad: 2}, {libro_id: 4, cantidad: 1}]}`

#### Scenario: Sin cliente
- **WHEN** se valida una venta sin cliente elegido
- **THEN** devuelve un error que indica que se debe elegir un cliente

#### Scenario: Sin renglones
- **WHEN** se valida una venta sin renglones
- **THEN** devuelve un error que indica que la venta debe tener al menos un renglón

#### Scenario: Cantidad inválida
- **WHEN** se valida un renglón con cantidad 0, negativa, decimal o mayor que 2147483647
- **THEN** devuelve un error que indica que la cantidad debe ser un entero entre 1 y 2147483647

#### Scenario: Libro repetido
- **WHEN** se validan dos renglones con el mismo libro
- **THEN** devuelve un error que indica que un libro no puede repetirse en la venta

#### Scenario: Libro inexistente
- **WHEN** se valida una venta con un ID de libro (o de cliente) que no existe en la base
- **THEN** la validación no lo rechaza: la existencia la decide la API con 409

### Requirement: Carga de opciones de la venta
Al abrir la vista Ventas, los selectores "Cliente" y "Libro" MUST cargarse desde la API. Mientras cargan MUST mostrarse el mensaje de carga y "Agregar renglón" y "Confirmar venta" MUST estar deshabilitados. Si alguna carga falla, MUST mostrarse el mensaje de error con "Reintentar", sin listas parciales, y los botones MUST seguir deshabilitados.

#### Scenario: Carga correcta
- **WHEN** con el backend activo se abre la vista Ventas
- **THEN** la pestaña Red muestra `GET /api/clientes/?limit=100&offset=0` y `GET /api/libros/?limit=100&offset=0` con 200, y al terminar los botones se habilitan

#### Scenario: Backend detenido al abrir
- **WHEN** se abre la vista Ventas con el backend detenido
- **THEN** se muestra el error de carga de opciones con "Reintentar", los selectores quedan solo con su opción inicial y "Agregar renglón" y "Confirmar venta" están deshabilitados

#### Scenario: Reintento
- **WHEN** tras un error de carga se levanta el backend y se activa "Reintentar"
- **THEN** los selectores se completan, el mensaje de error se oculta y los botones se habilitan

### Requirement: Comprobante de la venta registrada
Ante un 201, la vista Ventas MUST mostrar un bloque «Venta registrada» con ID, fecha, cliente, una tabla de renglones (libro, cantidad, precio unitario, subtotal) y el total, todos tomados de la respuesta tal como llegan, sin recalcularlos, más un enlace al detalle de esa venta en el Historial. Luego MUST vaciar el borrador, volver el cliente a su opción inicial y la cantidad a 1.

#### Scenario: Importes de la respuesta
- **WHEN** con el seed cargado se confirma la venta de Tomás Ríos con 2 × Rayuela y 1 × Respiración artificial
- **THEN** el bloque muestra el ID asignado, Tomás Ríos, los renglones 2 × 25000.00 = 50000.00 y 1 × 27000.00 = 27000.00 y el total 77000.00, idénticos a los del cuerpo de la respuesta en la pestaña Red

#### Scenario: Formulario limpio tras confirmar
- **WHEN** se muestra el bloque «Venta registrada»
- **THEN** el borrador no tiene renglones, el selector "Cliente" está en su opción inicial y se ve el mensaje de venta confirmada

#### Scenario: Enlace al historial
- **WHEN** se activa el enlace al detalle del bloque «Venta registrada»
- **THEN** se abre la vista Historial con el detalle de esa venta pedido a la API

#### Scenario: Respuesta 201 inesperada
- **WHEN** la API responde 2xx con un cuerpo que no es una venta (sin `id` o sin lista de renglones)
- **THEN** no se muestra el bloque, se conserva el borrador y se informa que la respuesta fue inesperada y que conviene revisar el historial antes de reintentar

### Requirement: Rechazo de la venta conserva el borrador
Si la API rechaza la venta (409, 422 u otro código) o no responde, la vista Ventas MUST mostrar en el mensaje de venta rechazada un único error con el código y el mensaje del servidor, o el mensaje de fallo de conexión, y MUST conservar el cliente elegido y todos los renglones del borrador sin cambios.

#### Scenario: Libro inexistente
- **WHEN** el borrador contiene un libro que ya no existe en la base y se confirma
- **THEN** la API responde 409 y se muestra «(409) El libro indicado no existe.» con el borrador intacto

#### Scenario: Stock insuficiente
- **WHEN** se confirma un renglón con una cantidad mayor que el stock del libro
- **THEN** la API responde 409 y se muestra «(409) No hay stock suficiente para el libro indicado.» con el borrador intacto

#### Scenario: Cuerpo inválido
- **WHEN** la API responde 422 a la venta
- **THEN** se muestra el código 422 con el mensaje de validación del servidor, sin el JSON crudo, y el borrador queda intacto

#### Scenario: Sin conexión
- **WHEN** se confirma una venta con el backend detenido
- **THEN** se muestra el mensaje de fallo de conexión y el borrador queda intacto

### Requirement: Borrador solo en memoria
El borrador de la venta (cliente elegido y renglones) MUST mantenerse únicamente en memoria de la página: MUST NOT guardarse en `localStorage`, `sessionStorage`, cookies ni la URL, y MUST perderse al recargar la vista.

#### Scenario: Recarga con borrador
- **WHEN** se agregan renglones al borrador y se recarga la vista Ventas
- **THEN** la vista abre sin renglones y con el cliente en su opción inicial

#### Scenario: Almacenamiento del navegador sin borrador
- **WHEN** tras componer y confirmar ventas se revisan `localStorage` y `sessionStorage` del origen `http://127.0.0.1:8080`
- **THEN** no hay entradas creadas por la vista Ventas
