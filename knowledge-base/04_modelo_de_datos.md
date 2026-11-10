# 04 — Modelo de datos

Arrays y objetos JS con **identificadores estables** (modelo del parcial).

> **Contrato vigente en el Global:** los schemas del backend (`backend/app/modules/*/schemas.py`). Difiere del parcial en: el libro tiene `stock` (entero ≥ 0); las autorías son `{autor_id, rol, orden}` con rol en {autor, coautor, traductor, ilustrador} (no `autorIds`); el cliente usa el campo `nombre` (no «nombre completo»).

## Entidades
| Entidad | Campos |
|---------|--------|
| Libro | id, título, ISBN, precio, editorialId, generoId (opcional; ausente = «Sin clasificar»), autorIds (1..n) |
| Editorial | id, nombre |
| Género | id, nombre |
| Autor | id, nombre |
| Cliente | id, nombre completo, email |
| Venta | id, fecha, clienteId (+ nombre descriptivo), renglones, total |
| Renglón | libroId (+ título descriptivo), cantidad, precio unitario histórico, subtotal |

## Relaciones
```
Editorial 1──n Libro n──m Autor
Género    0..1──n Libro
Cliente   1──n Venta 1──n Renglón n──1 Libro
```
- Cada libro: una editorial existente y uno o más autores existentes; género opcional pero, si se asigna, existente.
- El renglón **copia** el precio unitario al confirmar y conserva datos descriptivos (título, cliente) para leer la venta después.

## Seed data (mínimo, Ej. 3)
≥ 6 libros, 2 editoriales, 2 géneros, 3 autores, 3 clientes ficticios. Debe incluir al menos un libro sin género y uno con varios autores. Se cargan en el primer inicio y no se duplican al reabrir.


> Seed del Global: los datos ficticios los carga `python -m scripts.seed` en PostgreSQL (vacía las tablas antes de cargar: revisar antes de correrlo en un entorno con datos). La regla «no se duplican al reabrir» del parcial (primer inicio en `localStorage`) es antecedente.

## Persistencia
Los registros (libros, clientes, ventas e importes) viven en **PostgreSQL** y se acceden solo por la API (FastAPI). Las migraciones (`alembic upgrade head`) crean el esquema. El navegador no guarda nada confirmado: únicamente mantiene en memoria el borrador de la venta, sin `localStorage`.

> Antecedente del parcial: libros, clientes y ventas se guardaban en `localStorage`.
