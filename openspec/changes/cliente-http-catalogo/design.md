# Design

## Context

- `index.html` hoy trae cuatro tarjetas escritas a mano, un `<template id="plantilla-tarjeta-libro">` (título, ISBN, editorial, género, autores, precio) y carga `datos.js`, `persistencia.js` y `catalogo.js`. `catalogo.js` es un IIFE que expone `window.Catalogo`, filtra en memoria (`filtrarLibros`) y alterna dos mensajes (`#catalogo-mensaje-vacio`, `#catalogo-mensaje-sin-resultados`). Ninguna otra página usa `window.Catalogo`.
- Las otras cuatro páginas siguen cargando `datos.js` + `persistencia.js` (`localStorage`) y se migran en I-03/I-04. Todos los scripts del frontend son IIFE clásicos con `defer` que publican un objeto en `window`.
- Contrato del backend relevado en `backend/app/modules/libros/` y `backend/app/core/pagination.py`:
  - `GET /libros/?titulo=&genero_id=&limit=&offset=` → 200 con **lista** de `LibroRead` `{id, isbn, titulo, precio, stock, editorial: {id, nombre, pais}, genero: {id, nombre} | null}`, ordenada por `id`, **sin total**. `limit` 1–100 (20 por defecto), `offset` ≥ 0; fuera de rango → 422. `titulo` filtra con `ILIKE '%…%'` si no es vacío.
  - `GET /libros/{id}` (ruta **sin** barra final) → 200 `LibroDetalleRead` (= `LibroRead` + `autores: [{id, autor_id, nombre, nacionalidad, rol, orden}]`, ya ordenados por `orden`) o 404 `{"detail": "El libro no existe."}`; id fuera de int32 → 422.
  - `precio` es `Decimal` y Pydantic v2 lo serializa como **cadena** con dos decimales (`"18500.50"`).
  - Errores: `detail` cadena (404/409) o lista de `{loc, msg, type}` (422). Cuando el backend está caído, Nginx responde 502 con cuerpo **HTML**.
  - Sin barra final, FastAPI responde 307 y el `Location` reescrito por Nginx pierde el puerto (observado en I-01, tarea 4.2).
- El seed (`python -m scripts.seed`) deja 4 libros: «Antología de la literatura fantástica» (id 2) sin género y con tres autores (autor, coautor, coautor).
- La imagen Nginx copia `public/` al construirse (`COPY public/ …`): cada cambio en el frontend requiere reconstruir la imagen o montar la carpeta para verla.

## Goals / Non-Goals

**Goals:**
- Dejar en `api.js` el único punto que conoce la base `/api` y que llama a `fetch`, con una forma de error estable que I-03/I-04 reutilicen sin cambios.
- Cubrir el caso G-01 completo con el seed de 4 libros (incluida la paginación).

**Non-Goals:**
- Cache de respuestas, reintentos automáticos, cancelación de peticiones con `AbortController` o tiempo máximo de espera.
- Filtro por género (`genero_id`), orden configurable o total de páginas (el backend no lo informa).
- Migrar las otras cuatro páginas o borrar `datos.js`/`persistencia.js` (siguen en uso hasta I-03/I-04).
- Cambios en `backend/`.

## Decisions

1. **`api.js` como IIFE que publica `window.Api`, cargado con `defer` antes de `catalogo.js`.** Mantiene el patrón de los seis scripts existentes; las páginas de I-03/I-04 solo agregan una etiqueta `<script>`. *Alternativa*: ES modules (`type="module"`, permitido por el stack) → descartada por ahora: mezclaría dos estilos de carga en el mismo proyecto y obligaría a reescribir los scripts que dependen de globales.

2. **Interfaz del cliente.** `Api.pedir(ruta, opciones)` → `Promise` con el JSON ya interpretado (o `null` si la respuesta no tiene cuerpo). `opciones = {metodo = "GET", parametros, cuerpo}`. La URL es `BASE + ruta` (`var BASE = "/api"`, única aparición); `ruta` se pasa exacta como la declara el backend (`"/libros/"`, `"/libros/" + id`) y el cliente **no** agrega ni quita barras, para que el contrato quede visible en cada llamada. `parametros` se arma con `URLSearchParams`, omitiendo `undefined`, `null` y `""`. Con `cuerpo` se envía `JSON.stringify(cuerpo)` y `Content-Type: application/json`. *Alternativa*: funciones por recurso (`Api.listarLibros`) → descartada: duplica lógica y oculta la ruta exacta que pide la consigna; si hace falta, el catálogo define sus propias funciones finas sobre `pedir`.

3. **Forma de error única.** La promesa se rechaza con un objeto `{tipo, estado, mensaje}`:
   - `tipo: "red"` si `fetch` rechaza (sin respuesta) o si el estado es 502/503/504 (el proxy no alcanzó el backend); `mensaje` fijo: «No se pudo conectar con el servidor. Revisá la conexión e intentá de nuevo.».
   - `tipo: "http"` para el resto de los estados fuera de 2xx; `mensaje` desde `detail`: cadena tal cual; lista → `msg` de cada elemento (quitando el prefijo `Value error, ` de los validadores de Pydantic) precedido del último elemento de `loc` cuando es un nombre de campo, unidos con «; »; sin `detail` o cuerpo no JSON → mensaje genérico por código (404, 409, 422, 5xx, otro).
   - El cuerpo se lee siempre como texto y se intenta `JSON.parse` dentro de `try`, así el HTML del 502 nunca rompe el flujo.
   *Alternativa*: lanzar `Error` con el mensaje → descartada: I-03/I-04 necesitan el `estado` (409 vs 422) y el catálogo necesita distinguir red de HTTP sin parsear texto.

4. **Estado de la consulta y descarte de respuestas viejas.** `catalogo.js` mantiene `consulta = {titulo, limit, offset}` y un contador `numeroSolicitud`; cada carga incrementa el contador y al resolver se ignora si ya no es la última. Lo mismo para el detalle con su propio contador. *Alternativa*: `AbortController` → no aporta más que el contador para este caso y agrega manejo del `AbortError`; queda como mejora futura.

5. **Filtro al escribir con espera de 300 ms; al enviar, inmediato.** El evento `input` reprograma un temporizador de 300 ms; `submit` lo cancela y carga ya (`preventDefault`). Cualquier cambio de filtro o de «Libros por página» fija `offset = 0`. El texto se recorta con `trim()` y, si queda vacío, no se envía `titulo` (el backend filtraría por `'% %'` con solo espacios). *Alternativa*: buscar solo al enviar → rompería el comportamiento actual del spec («al escribir y al enviar»); sin espera → una petición por tecla.

6. **Paginación sin total.** «Siguiente» se habilita solo si la página llegó completa (`libros.length === limit`). Si al avanzar llega una página vacía con `offset > 0` (cantidad exacta múltiplo de `limit`), se restaura el `offset` anterior, se conserva la lista en pantalla, se deshabilita «Siguiente» y el indicador informa «No hay más libros.». El indicador muestra «Libros X–Y» (`offset + 1` a `offset + libros.length`). Selector «Libros por página» con 2, 5, 10, **20** (seleccionado), 50 y 100: los valores chicos permiten demostrar G-01 con los 4 libros del seed sin agregar datos. *Alternativas*: pedir `limit + 1` para saber si hay más → descartada: la petición no mostraría el `limit` elegido (20 enviaría 21) y con 100 daría 422; una segunda petición de sondeo `limit=1` → duplica peticiones por página.

7. **Tarjetas en grilla, no tabla.** Se conserva el molde `<template>` y la grilla `.catalogo-lista` (spec `presentacion-adaptable` sin cambios). Del molde se quita `Autores` y se agrega al pie un botón «Ver detalle» con `<span class="visualmente-oculto"> de «título»</span>` escrito con `textContent` para el nombre accesible. *Alternativa*: `<table>` (el roadmap habla de «columnas») → descartada: obligaría a modificar el requisito de grilla de tarjetas y la maqueta adaptable ya verificada, sin ganancia para la consigna, que solo pide mostrar los datos.

8. **Detalle en una sección de la misma página.** `<section id="catalogo-detalle" aria-labelledby="titulo-detalle" hidden>` después del listado, con `h2` `tabindex="-1"` (recibe el foco al cargar), sus propios mensajes de carga (`role="status"`) y error (`role="alert"`), un `<dl>` (título, ISBN, precio, stock, editorial, género) y un `<ol>` de autores «Nombre — rol» ordenado por `orden` (copia ordenada de la lista; el backend ya la envía así). «Cerrar detalle» oculta la sección y devuelve el foco al botón que la abrió. *Alternativas*: `<dialog>` modal → manejo de foco y cierre más complejo y estilos nuevos; página `libro.html?id=` → agrega una sexta vista fuera de la navegación del spec.

9. **Precio tal como llega.** Si `precio` es cadena se muestra tal cual (ya trae dos decimales); si llegara como número se formatea con `toFixed(2)`. No se convierte la cadena a número para no alterar importes (regla dura 4). No se agrega símbolo de moneda (igual que el resto de las vistas; pregunta abierta 5 de la KB).

10. **Un único conmutador de estados.** `mostrarEstado(nombre)` con `nombre ∈ {cargando, vacio, sin-resultados, error, resultados}` pone `hidden` en los cuatro mensajes y en la lista salvo el que corresponde, y deshabilita «Anterior»/«Siguiente»/selector mientras está en `cargando`. El mensaje de error es un `<div class="mensaje mensaje--error" role="alert">` con un `<p>` (texto vía `textContent` desde `error.mensaje`) y el botón «Reintentar», que vuelve a cargar con la `consulta` vigente. Los controles de paginación se agrupan en un `<div class="paginacion" role="group" aria-label="Paginación del catálogo">`, no en un `<nav>`, para no sumar un segundo `nav` a la página.

11. **Cambios de marcado y estilos acotados.** `index.html`: se quitan las tarjetas fijas y los scripts `datos.js`/`persistencia.js`, se agrega `js/api.js`, los nuevos mensajes, la paginación y la sección de detalle; el pie pasa a «TPI Programación III — datos ficticios servidos por la API de la librería.». `estilos.css`: `.paginacion` (Flexbox con `flex-wrap`), `.detalle-libro` sumado a la regla compartida de `.tarjeta-libro, .detalle-venta`, y el botón del pie de tarjeta, reutilizando variables de `:root`.

## Risks / Trade-offs

- [El backend no informa el total] → no se puede mostrar «página N de M» y con cantidad múltiplo de `limit` hay un clic de «Siguiente» que no avanza. Mitigación: decisión 6 (se conserva la página y se informa el fin). Se registra como brecha de contrato en la KB; no se toca el backend.
- [Respuestas fuera de orden al escribir rápido] → la lista mostraría un filtro viejo. Mitigación: contador de solicitudes (decisión 4).
- [Ruta sin barra final por error] → 307 con `Location` sin puerto: el navegador sale de `:8080` y falla como error de red. Mitigación: rutas literales en cada llamada y verificación en la pestaña Red de que no hay 307.
- [Pydantic cambia la serialización de `Decimal` a número] → el precio perdería ceros finales. Mitigación: `formatearPrecio` acepta ambos tipos (decisión 9).
- [La imagen copia `public/` al construir] → probar sin reconstruir muestra la versión vieja. Mitigación: durante el desarrollo se puede montar la carpeta en solo lectura (`-v "${PWD}\public:/usr/share/nginx/html:ro"` en el `docker run`, desde `frontend/`); la verificación final se hace siempre sobre una imagen reconstruida.
- [Las otras vistas siguen usando `localStorage` y datos locales] → la regla dura 4 se cumple solo en el Catálogo hasta I-03/I-04. Se acepta como transición; el spec `datos-locales` lo acota explícitamente.
- [Datos de prueba para casos borde (título con `<`, `&`; libro sin autores; libro inexistente)] → requieren escribir en la base. Mitigación: hacerlo con `PATCH`/`POST` contra la API en local y restaurar con `python -m scripts.seed`; nunca en el despliegue.

## Migration Plan

Cambio solo de frontend: `api.js` nuevo, `index.html`, `catalogo.js` y `estilos.css` modificados. Para verlo: reconstruir la imagen (`docker build -t libreria-frontend .` desde `frontend/`) y ejecutarla como indica el README de I-01, con el backend activo y el seed cargado. Rollback: revertir el commit; el Catálogo vuelve a los datos locales sin afectar a las otras vistas.

## Open Questions

- Símbolo de moneda en los importes (pregunta 5 de la KB): se mantiene sin símbolo; si se decide uno, es un cambio de formato que no altera specs ni tareas.
- El requisito «Aviso de maqueta de la etapa 1» de `navegacion-vistas` no se cumple en el HTML actual (ninguna vista tiene aviso) y ya no describe el Global; queda fuera de este change y se anota en la KB para que se resuelva en un change posterior (I-03/I-04 al tocar sus vistas, o I-06 en la revisión de entrega).
