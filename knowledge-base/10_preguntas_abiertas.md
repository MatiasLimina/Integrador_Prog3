# 10 — Preguntas abiertas e inconsistencias

> **Antecedente del parcial.** Las preguntas 1–7 de abajo son del parcial. Las preguntas 2–4 quedan resueltas u obsoletas por el Global (ids y fechas de venta los asigna la API; no hay `localStorage`; el backend rechaza renglones repetidos con 422, ver «Brechas de contrato»). La pregunta 1 (multipágina o una página) ya está resuelta: el frontend es multipágina.

## Prioridad media
1. _(Resuelta: multipágina)_ ¿Multipágina o una sola página con secciones? (la consigna permite ambas).
2. _(Obsoleta en el Global)_ ¿Formato de identificador de venta y de fecha (ISO, local)?
3. _(Obsoleta en el Global)_ ¿Claves y estructura exactas de localStorage? Deben quedar en el README para la prueba del precio histórico.
4. _(Resuelta en I-04: el libro repetido se suma a la cantidad del renglón existente; el backend rechaza duplicados con 422 como defensa, ver RN-17)_ ¿Qué mensaje/regla se aplica ante libro repetido: sumar cantidad o rechazar? (la consigna acepta ambos; elegir y documentar).

## Prioridad baja
5. ¿Símbolo/moneda de importes?
6. ¿Procedencia de imágenes, si se usan imágenes ajenas?
7. Fechas, canal de entrega y modalidad: las comunica el docente por separado (no definidas en la consigna).

## Inconsistencias detectadas
- La consigna titula «Ejercicio 1 · 1.» etc. (numeración duplicada); no afecta el alcance.
- El Ej. 1 pide datos estáticos pero «Ver detalle» en Historial exige una vista de detalle: definir cómo se maqueta en Etapa 1.
- Nota: `Repaso Primer Parcial.pdf` se ignoró como fuente porque su texto ya está en `docs/consignas/parcial-front-ejercicio-1.md`.

## Discovery
- Sin incertidumbres de baja confianza en los 6 campos `discovery` (se infirieron con claridad); no hay `discovery` upstream (omitido).

## Global — preguntas
- Integrantes del grupo para el README: se completan en I-06.
- Selectores de autores y clientes: resuelta, ver D-G04 en `09`.

## Brechas de contrato para I-03/I-04
Se registran para que los changes siguientes no las redescubran (no se implementan en I-00):
- El formulario de clientes envía `nombreCompleto`; `ClienteCreate` espera `nombre` y rechaza campos extra (`extra="forbid"`) → 422. Lo resuelve I-03.
- `LibroCreate.autores` acepta lista vacía (`autores=[]`), pero la consigna exige al menos un autor → la validación vive en el frontend (I-03). No se cambia el backend.
- El parcial modelaba `autorIds` y no tenía `stock`; el contrato exige autorías `{autor_id, rol, orden}` con rol en {autor, coautor, traductor, ilustrador} y `stock` entero ≥ 0 (I-03).
- `POST /ventas/` rechaza renglones con el mismo `libro_id` (422). El borrador del frontend debe evitarlos antes de enviar; si suma la cantidad o rechaza el duplicado lo decide I-04 (RN-17).
- Los listados `GET /autores/` y `GET /clientes/` no filtran por nombre y tienen tope `limit=100` por página: el frontend pagina con `offset` (D-G04).

## Brechas de contrato halladas en I-02
Relevadas al construir el cliente HTTP y el Catálogo; ninguna requiere cambios en el backend:
- El listado `GET /libros/` devuelve una lista sin total: no hay «página N de M». La paginación se resuelve en el frontend (página completa ⇒ puede haber más; página vacía al avanzar ⇒ fin del listado). Atiende I-02; sin cambios en el backend.
- `precio` se serializa como cadena con dos decimales (`"18500.50"`). El frontend la muestra tal cual y no la convierte a número. Atiende I-02 y rige para I-03/I-04; sin cambios en el backend.
- Las rutas de recurso no llevan barra final (`/libros/{id}`) y las de colección sí (`/libros/`); con la barra equivocada FastAPI responde 307 y el `Location` reescrito por Nginx pierde el puerto. El cliente pasa la ruta exacta en cada llamada. Atiende I-02; sin cambios en el backend.
- Con el backend caído, Nginx responde 502 con cuerpo HTML: el cliente lo trata como fallo de conexión sin intentar interpretarlo como JSON. Atiende I-02; sin cambios en el backend.
- Los `msg` de los 422 traen el prefijo `Value error, ` en las validaciones propias: el cliente lo quita al armar el mensaje. Atiende I-02 (reutilizable en I-03/I-04); sin cambios en el backend.
- `titulo` con solo espacios filtraría por `'% %'`: el frontend recorta el texto y omite el parámetro si queda vacío. Atiende I-02; sin cambios en el backend.
- El seed deja 4 libros: se ofrecen tamaños de página chicos (2, 5, 10) para poder demostrar G-01 (paginación) sin cargar más datos. Atiende I-02; sin cambios en el backend.
- El requisito «Aviso de maqueta de la etapa 1» de `navegacion-vistas` no se cumple en el HTML actual (ninguna vista tiene aviso) y ya no describe el Global. Queda para un change posterior (I-03/I-04 al tocar sus vistas, o I-06 en la revisión de entrega); no requiere cambios en el backend.

## Brechas de contrato halladas en I-03
Relevadas al migrar las altas de libros y clientes a la API; ninguna requiere cambios en el backend:
- Los listados (`/editoriales/`, `/generos/`, `/autores/`, `/libros/`, `/clientes/`) devuelven 20 elementos por defecto: los selectores y tablas piden `limit=100` y paginan con `Api.listarTodo`. Atiende I-03; lo reutiliza I-04.
- El ISBN y el email se comparan exactos en la base: `978-950-07-0001-1` y `9789500700011`, o `Lucia@example.com` y `lucia@example.com` (`EmailStr` solo pasa el dominio a minúsculas), se registran como distintos. Se pierde la normalización del parcial (RN-06, RN-12); la unicidad la decide el 409 de la API y no se cambia el backend. Atiende I-03.
- `stock` tiene `default=0` en el backend, pero el formulario lo exige escrito. Atiende I-03; sin cambios en el backend.
- `orden` repetido entre autorías se acepta; el mismo autor dos veces responde 409 (`pk_libro_autor`), por eso el navegador lo rechaza antes de enviar. Atiende I-03; sin cambios en el backend.
- `precio` se envía como cadena (`"1500.50"`) para que `Decimal` reciba el valor exacto sin pasar por coma flotante. Atiende I-03; sin cambios en el backend.
- Ventas e Historial siguen con datos locales: lo registrado por la API en Libros y Clientes no aparece allí hasta I-04. No requiere cambios en el backend.

## Brechas de contrato halladas en I-04
Relevadas al migrar Ventas e Historial a la API; ninguna requiere cambios en el backend:
- `GET /ventas/` devuelve las ventas ordenadas por `id` ascendente y sin total: la venta recién registrada queda en la última página. El comprobante ofrece un enlace directo (`historial.html?venta=ID`) y se muestra el rango visible. Atiende I-04; cambiar el orden sería un change de backend aparte.
- `POST /ventas/` descuenta stock y responde 409 «No hay stock suficiente para el libro indicado.» aunque la consigna trate el stock como dato del catálogo. El borrador no muestra stock: el operador se entera por el 409 y el borrador se conserva. Atiende I-04; sin cambios en el backend.
- Los importes (`precio_unitario`, `subtotal`, `total`) llegan como cadenas con dos decimales y se muestran tal cual, sin `Number()` ni `toFixed()`. Atiende I-04; sin cambios en el backend.
- `fecha` llega con microsegundos: el navegador la muestra local `dd/mm/aaaa hh:mm` y usa `toISOString()` (milisegundos) en `<time datetime>`. Atiende I-04; sin cambios en el backend.
- Los 409 por cliente o libro inexistente y el 422 por libros repetidos de G-06 no se pueden provocar desde la UI normal (los selectores vienen de la API y el borrador suma repetidos). Se verifican alterando el `value` de una opción de «Libro» (409) y desde la consola con `Api.pedir` (409 con `cliente_id: 999` y 422 con dos renglones del mismo libro), comprobando que el historial no cambia. Atiende I-04; sin cambios en el backend.
- Un fallo de red durante el `POST` es ambiguo: la venta pudo registrarse. El mensaje pide revisar el historial antes de reintentar y el borrador se conserva. Atiende I-04; sin cambios en el backend.
