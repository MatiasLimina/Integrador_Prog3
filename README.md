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

> Pendiente: se completa al terminar la integración (ejercicios 1 a 4).

1. Backend: seguir [backend/README.md](backend/README.md) (PostgreSQL con Docker, `alembic upgrade head`, `python -m scripts.seed`, `uvicorn`).
2. Frontend: imagen Nginx con proxy `/api/` → backend (ver consigna, pasos 3 y 4).

## Datos de prueba

`python -m scripts.seed` desde `backend/`. **Vacía las tablas** y carga datos ficticios con ids fijos.

## Historial

Este repositorio se extrajo de [Prog3_GordosProgramacion](https://github.com/MatiasLimina/Prog3_GordosProgramacion) conservando los commits del frontend del parcial y del backend desde que se copió para el despliegue (3/11/2026). El desarrollo anterior del backend está en la carpeta `TP - DEL OBJETO A LA PERSISTENCIA/` de ese repositorio.
