# DEPLOY — Librería en Easypanel

> Borrador. Se completa durante el ejercicio 5. El despliegue anterior del TP backend (docker run manual en el puerto 8000) está en [docs/antecedentes/tp-backend/DEPLOY.md](docs/antecedentes/tp-backend/DEPLOY.md).

## URL pública

_Pendiente._

## Revisión desplegada

_Pendiente (commit)._

## Servicios

| Servicio | Build Path | Builder | Puerto interno | Dominio |
|---|---|---|---|---|
| backend | `/backend` | Dockerfile | 8000 | ninguno (solo red interna) |
| frontend | `/frontend` | Dockerfile | 80 | HTTPS asignado |

## Proxy

Nginx sirve `public/` y reenvía `/api/` a `http://${API_UPSTREAM}/`.

## Variables de entorno (solo nombres)

- backend: `DATABASE_URL` (driver `postgresql+asyncpg`), `DB_ECHO`
- frontend: `API_UPSTREAM` (`<proyecto>_backend:8000`)

## Migraciones

_Pendiente._

## Carga inicial

_Pendiente._

## Pasos de actualización

_Pendiente._

## Casos G-01 a G-07

_Pendiente. Evidencia en [evidencia/](evidencia/)._
