# 05 — Reglas de negocio

## Catálogo (Ej. 3)
- **RN-01** Libro sin género se muestra «Sin clasificar».
- **RN-02** Filtro por título: sin distinguir mayúsculas/minúsculas, coincidencia parcial, `trim` de la búsqueda.
- **RN-03** Búsqueda vacía muestra todo el catálogo; sin coincidencias muestra un mensaje claro.
- **RN-04** Datos escritos por usuarios se insertan como texto en el DOM (`textContent`, nunca HTML).

## Alta de libros (Ej. 4)
- **RN-05** Título e ISBN no vacíos.
- **RN-06** ISBN único. _En el Global la unicidad la decide la API (409) y compara el valor exacto, con guiones y espacios tal cual; el navegador solo recorta los espacios exteriores (ver brechas de I-03 en `10`). No se valida dígito de control._
- **RN-07** Precio numérico y > 0, con hasta dos decimales y máximo 99999999.99 (valida el navegador; se envía como cadena). Stock entero ≥ 0 y ≤ 2147483647, obligatorio en el formulario (valida el navegador).
- **RN-08** Editorial elegida y al menos una autoría `{autor_id, rol, orden}` (rol en autor, coautor, traductor, ilustrador; orden entero ≥ 1; sin repetir autor): lo valida el navegador porque la API acepta `autores=[]`. La existencia de la editorial y de los autores la decide la API (409).
- **RN-09** Género opcional («Sin clasificar» = ausencia, se envía `genero_id: null`); si se asigna, su existencia la decide la API (409).

## Alta de clientes (Ej. 4)
- **RN-10** Nombre completo y email no vacíos (un solo campo de nombre). _En el Global el campo se envía como `nombre` (ver nota de contrato en 04)._
- **RN-11** Email con formato válido.
- **RN-12** Email único. _En el Global la unicidad la decide la API (409) y compara el valor exacto (la API solo pasa el dominio a minúsculas); el navegador solo recorta los espacios exteriores (ver brechas de I-03 en `10`)._

## Formularios (Ej. 4)
- **RN-13** Envío controlado con `preventDefault`; errores cerca del formulario; solo se agrega el registro si todo pasa.
- **RN-14** Tras alta correcta, listados y selectores se actualizan sin recargar.

## Ventas (Ej. 5)
- **RN-15** Requiere cliente existente y ≥ 1 renglón con libro existente. _En el Global el cliente y los libros se eligen de listados de la API; el navegador solo valida que haya cliente y ≥ 1 renglón, y la existencia la decide la API (409 si el cliente o un libro no existen)._
- **RN-16** Cantidad entera > 0 (rechaza 0, negativos, decimales).
- **RN-17** Sin libros repetidos en la misma venta: se modifica la cantidad del renglón o se informa el duplicado. _En el Global, agregar un libro que ya está en el borrador suma la cantidad a su renglón (el navegador nunca envía repetidos); el 422 de la API ante repetidos queda como defensa._
- **RN-18** Antes de confirmar se pueden cambiar cantidades y quitar renglones.
- **RN-19** subtotal = cantidad × precio; total = suma de subtotales; importes con dos decimales. _En el Global el borrador no muestra importes (solo título, precio actual y cantidad); los importes confirmados (precio unitario, subtotales y total) se muestran siempre desde la respuesta de `POST /ventas/` (comprobante) y de `GET /ventas/{id}` (detalle), sin recalcular (regla dura 4)._
- **RN-20** No se confirma sin cliente, sin renglones o con cantidades inválidas.
- **RN-21** Al confirmar se registra id, fecha, cliente, renglones y total; se limpia el formulario y se muestra mensaje de resultado. _En el Global el ID, la fecha, los precios unitarios, los subtotales y el total los asigna la API (`POST /ventas/` → 201); el navegador solo envía `{cliente_id, renglones:[{libro_id, cantidad}]}`._
- **RN-22** El precio unitario es **histórico**: se copia al renglón y no se relee del catálogo. _En el Global lo guarda la base en el renglón al confirmar; un `PATCH /libros/{id}` posterior no cambia las ventas ya registradas._
- **RN-23** Ventas confirmadas inmutables: no se editan ni eliminan desde la interfaz.

## Persistencia (Ej. 6)
- **RN-24** Primer inicio carga ejemplos; reaperturas recuperan lo guardado sin duplicar ejemplos ni ventas. _Antecedente del parcial: en el Global la carga inicial es `python -m scripts.seed` (vacía y recarga las tablas) y la persistencia es PostgreSQL vía la API (ver 04)._
