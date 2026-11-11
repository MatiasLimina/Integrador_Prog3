# Spec Delta

## MODIFIED Requirements

### Requirement: Listado de ventas
Al abrir la vista Historial, JavaScript MUST pedir `GET /api/ventas/` con `limit` y `offset` y mostrar una fila por venta recibida, en el orden de la respuesta, con columnas identificador, fecha, cliente, total y acciones. El total MUST mostrarse tal como lo devuelve la API, y el HTML MUST NOT traer ventas de ejemplo escritas a mano.

#### Scenario: Tabla de ventas
- **WHEN** con el seed cargado se abre la vista Historial
- **THEN** la tabla lista la venta 1 con su fecha, «Lucía Fernández» y el total 59001.00

#### Scenario: Listado generado desde los datos
- **WHEN** se cuentan las filas visibles al abrir la vista Historial
- **THEN** hay exactamente una fila por cada venta que devolvió la API para esa página, sin filas de ejemplo del HTML

#### Scenario: Venta recién registrada
- **WHEN** se confirma una venta en la vista Ventas y luego se abre la vista Historial y se avanza hasta la última página
- **THEN** la nueva venta aparece con el ID y el total que devolvió la API al registrarla

### Requirement: Acceso al detalle de una venta
Cada venta del listado MUST tener un control "Ver detalle" cuyo nombre accesible identifique la venta. Al activarlo, la vista MUST pedir `GET /api/ventas/{id}` (sin barra final) y mostrar el detalle con los valores que devuelve la API, sin reutilizar los datos de la fila del listado.

#### Scenario: Ver detalle
- **WHEN** se activa "Ver detalle" de la venta 1
- **THEN** la pestaña Red muestra `GET /api/ventas/1` con 200, sin redirección, y se muestra el detalle con sus renglones y el total

#### Scenario: Detalle con precio histórico
- **WHEN** se cambia el precio de un libro con `PATCH /api/libros/{id}` y luego se consulta el detalle de una venta anterior que lo incluye
- **THEN** cada renglón muestra el precio unitario y el subtotal registrados al confirmar, y el total no cambia

#### Scenario: Venta inexistente
- **WHEN** se pide el detalle de una venta que no existe
- **THEN** se muestra «La venta no existe.» en el área del detalle, sin datos de una venta anterior

### Requirement: Contenido del detalle de venta
El detalle de cada venta MUST mostrar identificador, fecha y hora, cliente y una tabla de renglones con libro, cantidad, precio unitario y subtotal, más el total, todos tal como los devuelve la API.

#### Scenario: Detalle de la venta de ejemplo
- **WHEN** con el seed cargado se consulta el detalle de la venta 1
- **THEN** muestra «Lucía Fernández», 1 × 22000.00 = 22000.00 de «Antología de la literatura fantástica», 2 × 18500.50 = 37001.00 de «El Aleph» y total 59001.00

#### Scenario: Fecha legible y legible por máquina
- **WHEN** se inspecciona la fecha del detalle
- **THEN** se lee la fecha y hora local en formato `dd/mm/aaaa hh:mm` dentro de un `<time>` cuyo `datetime` es una fecha y hora válida

### Requirement: Historial vacío
La vista Historial MUST incluir, ocultos por defecto, un mensaje de carga y uno de historial vacío con `role="status"`, y uno de error de carga con `role="alert"` y un botón "Reintentar". Solo uno de esos mensajes o la tabla MUST verse a la vez.

#### Scenario: Mensaje de historial vacío
- **WHEN** se inspecciona el HTML de la vista Historial
- **THEN** existen los mensajes de carga, historial vacío y error de carga, todos con `hidden`

#### Scenario: Sin ventas
- **WHEN** la API devuelve una lista vacía en la primera página
- **THEN** se muestra el mensaje de historial vacío y la tabla no muestra filas

#### Scenario: Backend detenido
- **WHEN** se abre la vista Historial con el backend detenido
- **THEN** se muestra el mensaje de error de conexión con "Reintentar" y la tabla no muestra filas; al levantar el backend y reintentar vuelven las filas

## ADDED Requirements

### Requirement: Paginación del historial
La vista Historial MUST ofrecer un selector "Ventas por página" (2, 5, 10, 20, 50 y 100; 20 por defecto) y botones "Anterior" y "Siguiente" que pidan la página con `limit` y `offset`. "Anterior" MUST deshabilitarse con `offset` 0 y "Siguiente" cuando la página llega incompleta o la siguiente resulta vacía; MUST mostrarse el rango de ventas visible.

#### Scenario: Primera página
- **WHEN** se abre la vista Historial
- **THEN** la petición es `GET /api/ventas/?limit=20&offset=0` y "Anterior" está deshabilitado

#### Scenario: Avanzar de página
- **WHEN** con al menos 3 ventas registradas se elige 2 ventas por página y se activa "Siguiente"
- **THEN** la petición es `GET /api/ventas/?limit=2&offset=2`, se muestran las ventas siguientes y "Anterior" se habilita

#### Scenario: Fin del listado
- **WHEN** la página actual llegó completa y al activar "Siguiente" la API devuelve una lista vacía
- **THEN** se siguen viendo las ventas de la página anterior, "Siguiente" queda deshabilitado y se informa que no hay más ventas

#### Scenario: Cambio de tamaño
- **WHEN** se cambia el valor de "Ventas por página"
- **THEN** se vuelve a pedir desde `offset=0`

### Requirement: Detalle tras recargar
La vista Historial MUST abrir directamente el detalle de una venta cuando su dirección incluye `?venta=N` con N entero de 1 a 2147483647, pidiéndolo a `GET /api/ventas/N`; con otro valor MUST informar que el identificador no es válido sin hacer la petición.

#### Scenario: Recargar el detalle
- **WHEN** se abre `historial.html?venta=2` y se recarga la página
- **THEN** tras cada carga se pide `GET /api/ventas/2` y se muestra el mismo detalle, con los mismos importes que devolvió la API al registrar la venta

#### Scenario: Identificador inválido
- **WHEN** se abre `historial.html?venta=abc` o `historial.html?venta=0`
- **THEN** se informa que el identificador de venta no es válido y no se pide el detalle

### Requirement: Datos del historial como texto
Todo dato devuelto por la API en el listado y en el detalle (cliente, títulos, fechas, importes y mensajes de error) MUST insertarse como texto, sin interpretarse como marcado.

#### Scenario: Título con marcado
- **WHEN** una venta incluye un libro cuyo título contiene `<b>texto</b>`
- **THEN** el detalle muestra literalmente `<b>texto</b>` y no aparece texto en negrita
