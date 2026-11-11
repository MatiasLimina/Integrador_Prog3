# despliegue Specification

## Purpose
Define cómo queda publicada la librería en Easypanel: un único punto de entrada HTTPS que sirve el frontend y reenvía `/api/` al backend por la red interna, con la base y el backend sin exposición pública, el esquema migrado al arrancar, datos que sobreviven a los redespliegues y configuración solo en el entorno privado de cada servicio.

## Requirements

### Requirement: Frontend publicado por HTTPS
La aplicación SHALL estar disponible en el dominio HTTPS asignado al servicio frontend. Easypanel MUST terminar HTTPS y reenviar por HTTP al puerto interno 80 del contenedor Nginx, que sirve `public/` según `servidor-frontend`.

#### Scenario: Apertura de la URL pública
- **WHEN** se abre `https://<dominio>/` en el navegador
- **THEN** la respuesta es 200 por HTTPS con certificado válido y se ve el Catálogo con sus estilos

#### Scenario: Páginas por la URL pública
- **WHEN** se piden `https://<dominio>/ventas.html` y `https://<dominio>/css/estilos.css`
- **THEN** cada una responde 200 con el archivo correspondiente de `public/`

### Requirement: API alcanzable solo a través del proxy
El backend MUST responder a través de `https://<dominio>/api/…` reenviado por el frontend a `<proyecto>_backend:8000` en la red interna. El servicio backend MUST NOT tener dominio público y el puerto de PostgreSQL MUST NOT estar publicado.

#### Scenario: Salud de la API por la URL pública
- **WHEN** se pide `GET https://<dominio>/api/health/ready`
- **THEN** la respuesta es 200 con la base informada como disponible

#### Scenario: Catálogo con datos por la URL pública
- **WHEN** se pide `GET https://<dominio>/api/libros/?limit=5&offset=0`
- **THEN** la respuesta es 200 con al menos un libro

#### Scenario: Backend sin dominio propio
- **WHEN** se revisa la sección Domains del servicio backend
- **THEN** no tiene ningún dominio asignado, incluido el automático de Easypanel

### Requirement: Esquema migrado al arrancar el backend
Cada arranque del backend MUST aplicar `alembic upgrade head` antes de iniciar la API, y MUST NOT servir peticiones si la migración falla. Un arranque sin migraciones pendientes MUST NOT modificar el esquema.

#### Scenario: Primer despliegue sobre base vacía
- **WHEN** el backend arranca contra una base sin tablas
- **THEN** los logs muestran las migraciones aplicadas hasta la última revisión y luego el inicio de Uvicorn en `0.0.0.0:8000`

#### Scenario: Redespliegue sin migraciones nuevas
- **WHEN** el backend se redespliega sin revisiones nuevas
- **THEN** los logs no muestran ningún `Running upgrade` y la API arranca

### Requirement: Datos persistentes entre redespliegues
Los registros (libros, clientes, ventas) MUST vivir en la base PostgreSQL asignada, fuera de los contenedores. Un redespliegue de cualquiera de los dos servicios MUST NOT perder ni reiniciar datos, y la carga inicial MUST NOT ejecutarse como parte de un despliegue o actualización.

#### Scenario: Redespliegue del backend
- **WHEN** se registró un dato ficticio, se redespliega el backend y se vuelve a consultar por la URL pública
- **THEN** el dato sigue presente con los mismos valores e ID

#### Scenario: Carga inicial explícita
- **WHEN** se despliega o actualiza cualquiera de los servicios
- **THEN** la carga inicial no se ejecuta sola; solo corre si alguien la lanza a mano desde Shell

### Requirement: Configuración solo en el entorno privado
`DATABASE_URL` (driver `postgresql+asyncpg`) MUST definirse en Environment del backend y `API_UPSTREAM` (`host:puerto`) en Environment del frontend. El repositorio, la imagen y la evidencia MUST contener solo nombres de variables o valores de muestra, nunca credenciales ni la URL real de la base.

#### Scenario: Backend sin DATABASE_URL
- **WHEN** el backend arranca sin `DATABASE_URL`
- **THEN** el contenedor termina con el mensaje «Falta la variable de entorno DATABASE_URL» y no expone la API

#### Scenario: Repositorio sin secretos
- **WHEN** se listan los archivos versionados y se buscan cadenas `postgresql+asyncpg://` con credenciales
- **THEN** no hay ningún `.env` versionado y solo aparecen valores de muestra de `env.example`

#### Scenario: Capturas sin valores privados
- **WHEN** se revisan las capturas `evidencia/I-05-*.png`
- **THEN** ninguna muestra contraseñas ni el valor de `DATABASE_URL`

### Requirement: Despliegue documentado y reproducible
`DEPLOY.md` MUST registrar la URL pública, la revisión desplegada (commit), las rutas de build, los puertos, el proxy, los nombres de las variables, las migraciones, la carga inicial, los pasos de actualización y la tabla de diagnóstico, de modo que otra persona pueda repetir el despliegue sin datos privados.

#### Scenario: Revisión publicada coincide
- **WHEN** se compara el commit indicado en `DEPLOY.md` con el que Easypanel muestra en el último despliegue de cada servicio
- **THEN** son el mismo commit de `main`

#### Scenario: Actualización siguiendo DEPLOY.md
- **WHEN** se publica un commit nuevo en `main` y se siguen los pasos de actualización de `DEPLOY.md`
- **THEN** ambos servicios quedan con la nueva revisión, `/api/health/ready` responde 200 y los datos previos siguen presentes
