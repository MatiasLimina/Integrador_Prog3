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
docs/        Consignas y antecedentes (deploy y evidencia del TP backend, README del parcial)
evidencia/   Casos G-01 a G-07 del Global
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

## Historial

Este repositorio se extrajo de [Prog3_GordosProgramacion](https://github.com/MatiasLimina/Prog3_GordosProgramacion) conservando los commits del frontend del parcial y del backend desde que se copió para el despliegue (3/11/2026). El desarrollo anterior del backend está en la carpeta `TP - DEL OBJETO A LA PERSISTENCIA/` de ese repositorio.
