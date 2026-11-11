# Librería — Global de Programación III

Librería web integrada y desplegada en Easypanel. El frontend del primer parcial (HTML, CSS y JS nativos) consume la API del TP «Librería: catálogo, clientes y ventas con FastAPI y PostgreSQL» (caps. 1 a 4).

## Grupo

- Lautaro Agustín Agüero
- Nicolás Lionel Monjelardi
- Matías Nicolás Limina Nuñez

## Estructura

```
backend/     API FastAPI + PostgreSQL (Dockerfile, migraciones Alembic, seed, tests)
frontend/    Imagen Nginx; public/ contiene las páginas, css/ y js/
docs/        Consignas y antecedentes (deploy y evidencia del TP backend, README del parcial) (solo en el repositorio, no va en el ZIP)
evidencia/   Capturas `G-0X-*` de los casos de entrega; `I-0X-*` del desarrollo
DEPLOY.md    Despliegue en Easypanel
```

## Ejecutar en local

1. Backend (desde `backend/`, con el entorno virtual activo, las dependencias instaladas (`pip install -r requirements.txt`) y `.env` creado desde `env.example` con `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` y `DATABASE_URL`; ver [backend/README.md](backend/README.md)). Ojo: `python -m scripts.seed` vacía las tablas y las vuelve a cargar. Si en Windows ya hay un PostgreSQL instalado escuchando en el puerto 5432, `alembic` falla con «connection was closed in the middle of operation»: agregar `POSTGRES_PORT=5433` en `.env`, usar `localhost:5433` en `DATABASE_URL` y volver a correr `docker compose up -d`.

```powershell
Set-Location backend
```

```powershell
docker compose up -d
```

```powershell
alembic upgrade head
```

```powershell
python -m scripts.seed
```

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

2. Frontend (en otra terminal, desde la raíz del repo; requiere Docker en ejecución):

```powershell
Set-Location frontend
```

```powershell
docker build -t libreria-frontend .
```

```powershell
docker run --rm --name libreria-frontend -p 127.0.0.1:8080:80 -e API_UPSTREAM=host.docker.internal:8000 libreria-frontend
```

3. Comprobar en el navegador `http://127.0.0.1:8080/api/health/ready` (debe responder 200) y abrir `http://127.0.0.1:8080` para ver el sitio.
4. Detener el frontend con Ctrl+C (el contenedor se elimina solo por `--rm`) y el backend con Ctrl+C.

Nota: `host.docker.internal` funciona de fábrica en Docker Desktop (Windows/macOS). Solo con Docker Engine en Linux hay que agregar `--add-host=host.docker.internal:host-gateway` al `docker run`. Si Windows Defender pide permiso para Python, aceptarlo solo para redes privadas.

## Datos de prueba

`python -m scripts.seed` desde `backend/`. **Vacía las tablas** y carga datos ficticios con ids fijos.

## Decisión de selectores

Los selectores de autores (alta de libros) y de clientes (ventas) se cargan desde los listados `GET /autores/` y `GET /clientes/`, pidiendo páginas de `limit=100` y avanzando `offset` hasta recibir menos de 100 elementos. `GET /clientes/{id}` se usa solo para recuperar un cliente por su ID (G-03) y `GET /libros/{id}` para el detalle de un libro. La consulta por ID no se eligió para los selectores (decisión D-G04, `knowledge-base/09_decisiones_y_supuestos.md`).

## Verificación (G-01 a G-07)

Casos ejecutados a mano el 2026-11-11 en https://libreria.matiaslimina.me con datos ficticios, sobre la revisión desplegada `8dd4865` (ver [DEPLOY.md](DEPLOY.md)). Cada fila registra el resultado observado y la evidencia en `evidencia/`.

| Caso | Pasos | Resultado observado | Evidencia |
|------|-------|---------------------|-----------|
| G-01 Catálogo (búsqueda, paginación, detalle) | Buscar «rayu»; tamaño de página 2 y **Siguiente** hasta el final; buscar «zzzz»; **Ver detalle** de Rayuela | «rayu» devuelve solo *Rayuela* (`GET /api/libros/?titulo=rayu&limit=20&offset=0` 200). Con tamaño 2: `limit=2&offset=0`, `offset=2` y `offset=4` con 200; termina en «Libros 3–4. No hay más libros.» con **Siguiente** deshabilitado. «zzzz» muestra «No se encontraron libros con ese título.». Detalle de Rayuela: `GET /api/libros/1` 200, stock 10, autor Julio Cortázar | `G-01-busqueda.png`, `G-01-paginacion.png`, `G-01-sin-coincidencias.png`, `G-01-detalle.png` |
| G-02 Alta de libro (201 y 409 por ISBN repetido) | En `libros.html`, registrar «Libro de prueba G-02» (ISBN `123`, precio 41.00, stock 2, editorial Sudamericana, género Cuento, autoría Silvina Ocampo, autor, orden 1); repetir el ISBN; consultar el detalle | `POST /api/libros/` 201, **ID 5**. El ISBN repetido devuelve `POST` 409 con «(409) Ya existe un libro con ese ISBN.» y no se crea otro libro. Detalle `GET /api/libros/5` 200 (capturado después de G-04 y G-05: precio 45.00, stock 0). Desvío respecto del plan (15000.00, stock 10, sin género, dos autorías): el género es opcional; el caso cubre stock, género y autoría igual que el plan | `G-02-libro-alta.png`, `G-02-libro-409.png`, `G-02-libro-detalle.png` |
| G-03 Alta de cliente (201, recuperación por ID y 409 por email repetido) | En `clientes.html`, registrar «Cliente Prueba G-03» (`g03.prueba@example.com`); buscarlo por ID; repetir el email | `POST /api/clientes/` 201 «Cliente registrado correctamente con ID 4.»; `GET /api/clientes/4` 200 con los mismos datos; el email repetido devuelve 409 «(409) Ya existe un cliente con ese email.» | `G-03-cliente-alta.png`, `G-03-cliente-por-id.png`, `G-03-cliente-409.png` |
| G-04 Venta (201, comprobante igual a la API, detalle tras recargar) | En `ventas.html`, cliente 4, 2 × «Libro de prueba G-02» y 1 × Rayuela; **Confirmar venta**; **Ver en el historial** y **F5** | `POST /api/ventas/` 201, venta **ID 2**; la respuesta de la API trae total «25082.00» (41.00 × 2 = 82.00 más 25000.00), idéntico al comprobante. Va a `historial.html?venta=2` y tras **F5** `GET /api/ventas/2` 200 con el mismo detalle | `G-04-venta-201.png`, `G-04-detalle-recarga.png` |
| G-05 Precio histórico (cambio de precio sin alterar la venta) | En la consola: `Api.pedir("/libros/5", {metodo: "PATCH", cuerpo: {precio: "45.00"}})`; ver el detalle del libro 5 en el Catálogo; recargar `historial.html?venta=2` | El detalle del libro 5 muestra precio 45.00; la venta 2 sigue con 41.00 × 2 = 82.00 y total 25082.00. No hay captura aparte de la respuesta del `PATCH`: la evidencia es el `GET` del detalle con 45.00 | `G-05-precio-historico.png`, `G-02-libro-detalle.png` |
| G-06 Rechazo (409 y 422 sin crear ventas) | En la consola, `POST /api/ventas/` con `cliente_id` 999; luego con `cliente_id` 4 y dos renglones del mismo `libro_id` 1; volver al historial | `cliente_id` 999 devuelve 409; dos renglones del libro 1 devuelven 422 con «renglones: No se puede repetir un libro en los renglones de una venta.». El historial sigue terminando en la venta 2 (no se creó ninguna). La variante por la interfaz (opción de «Libro» con `value` 999) no se ejecutó | `G-06-rechazo-409-422.png`, `G-06-rechazo-422-mensaje.png`, `G-06-historial-igual.png` |
| G-07 Despliegue (build, HTTPS, salud y persistencia tras redespliegue) | Redesplegar `backend` y `frontend` (commit `8dd4865`); abrir la URL pública y `/api/health/ready`; redesplegar `backend` otra vez y abrir `historial.html?venta=2` | Build del frontend «### Success» (2026-11-11 22:49:41 GMT); logs del backend con el contexto de Alembic sin `Running upgrade`, `Uvicorn running on http://0.0.0.0:8000` y `/health/ready` 200. HTTPS y `/api/health/ready` → `{"estado":"listo","base_de_datos":"disponible"}`. El commit desplegado es `origin/main` en ese momento (`8dd4865`). El cliente ID 3 de I-05 sigue tras el redespliegue (listado en `G-03-cliente-por-id.png`). `G-07-persistencia.png` se tomó después del segundo redespliegue del backend: `historial.html?venta=2` muestra los mismos datos e importes | `G-07-build-frontend.png`, `G-07-backend-arranque.png`, `G-07-https-health.png`, `G-03-cliente-por-id.png`, `G-07-persistencia.png` |

Los commits posteriores a `8dd4865` solo agregan documentación y evidencia: `git diff --stat 8dd4865 HEAD -- frontend backend` solo lista `backend/README.md` (enlaces a `docs/` pasados a texto); el código desplegado es idéntico.

### Validación W3C

Validación W3C (Nu HTML Checker, por dirección) de `index.html` en https://libreria.matiaslimina.me/: «Document checking completed. No errors or warnings to show.» ([G-W3C-index.png](evidencia/G-W3C-index.png)). Las otras páginas reutilizan las validaciones de los changes anteriores, vigentes porque el HTML no cambió desde `3064724`: [I-03-w3c-libros.png](evidencia/I-03-w3c-libros.png), [I-03-w3c-clientes.png](evidencia/I-03-w3c-clientes.png), [I-04-w3c-ventas.png](evidencia/I-04-w3c-ventas.png) e [I-04-w3c-historial.png](evidencia/I-04-w3c-historial.png).

## Demo

Guion corto en https://libreria.matiaslimina.me/ (sin pasos fuera del guion):

1. Catálogo: buscar por título (p. ej. «rayu») y abrir **Ver detalle**.
2. Ventas: elegir un cliente, agregar dos renglones (un libro con cantidad 2 y otro con cantidad 1) y **Confirmar venta**.
3. **Ver en el historial** y recargar con F5: el detalle se vuelve a pedir a la API y queda igual.
4. En la pestaña Red del navegador, comparar los importes (precios unitarios, subtotales y total) del comprobante con la respuesta del `POST /api/ventas/`.

## Entrega

Una entrega por grupo, eliminando carpetas de dependencias y caché (consigna). El ZIP se genera desde el commit final, fuera del repositorio, solo con lo versionado (`frontend`, `backend`, `README.md`, `DEPLOY.md` y `evidencia`; `docs/` no va). Desde la raíz del repo, en PowerShell:

```powershell
git archive --format=zip --output "..\Integrador_Prog3-Global.zip" HEAD frontend backend README.md DEPLOY.md evidencia
```

Mantener la URL pública operativa durante la corrección: no tocar Easypanel hasta entonces.

## Historial

Este repositorio se extrajo de [Prog3_GordosProgramacion](https://github.com/MatiasLimina/Prog3_GordosProgramacion) conservando los commits del frontend del parcial y del backend desde que se copió para el despliegue (3/11/2026). El desarrollo anterior del backend está en la carpeta `TP - DEL OBJETO A LA PERSISTENCIA/` de ese repositorio.
