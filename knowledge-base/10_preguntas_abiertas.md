# 10 — Preguntas abiertas e inconsistencias

> **Antecedente del parcial.** Las preguntas 1–7 de abajo son del parcial. Las preguntas 2–4 quedan resueltas u obsoletas por el Global (ids y fechas de venta los asigna la API; no hay `localStorage`; el backend rechaza renglones repetidos con 422, ver «Brechas de contrato»). La pregunta 1 (multipágina o una página) ya está resuelta: el frontend es multipágina.

## Prioridad media
1. _(Resuelta: multipágina)_ ¿Multipágina o una sola página con secciones? (la consigna permite ambas).
2. _(Obsoleta en el Global)_ ¿Formato de identificador de venta y de fecha (ISO, local)?
3. _(Obsoleta en el Global)_ ¿Claves y estructura exactas de localStorage? Deben quedar en el README para la prueba del precio histórico.
4. _(Parcialmente resuelta en el Global: el backend rechaza duplicados con 422; la UX — sumar cantidad o rechazar — la decide I-04 según RN-17)_ ¿Qué mensaje/regla se aplica ante libro repetido: sumar cantidad o rechazar? (la consigna acepta ambos; elegir y documentar).

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
