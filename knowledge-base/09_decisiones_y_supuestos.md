# 09 — Decisiones y supuestos

## Decisiones (impuestas por la consigna)
- **D-01** Frontend: solo HTML/CSS/JS nativos; sin librerías, frameworks, CDNs, npm ni build.
- **D-02** Datos simulados en el navegador; persistencia con localStorage; sin backend/API/login. **Reemplazada en el Global por D-G01 y D-G02** (datos en PostgreSQL vía la API; el navegador solo guarda el borrador de venta en memoria).
- **D-03** **Sin suite de tests ni test runners**: verificación manual reproducible + validación W3C del HTML. **Reemplazada en el Global por D-G03**: sigue valiendo para el frontend; el backend conserva `pytest`.
- **D-04** ISBN comparado sin espacios ni guiones; sin dígito de control.
- **D-05** Precio unitario histórico copiado al renglón.
- **D-06** Etapa 1 = Ej. 1 + 2 con datos estáticos y una interacción básica; Etapa 2 = Ej. 3–6.
- **D-07** Las maquetas pendientes se identifican como tales, no como operaciones completas.

## Supuestos
- **Suposición:** un solo operador, sin roles.
- **Suposición:** el Ej. 1 admite tanto multipágina como secciones en una página; se decide en el equipo.
- **Suposición:** el cliente se guarda en la venta junto con su nombre descriptivo para que el historial sea legible aunque cambien los datos.
- **Suposición:** la moneda no se especifica; los importes se muestran con dos decimales sin símbolo fijo.
- **Suposición (antecedente del parcial):** los identificadores de venta se generaban localmente. En el Global los asigna la API.

## Decisiones del Global
- **D-G01** Registros e importes confirmados en PostgreSQL vía la API; el navegador solo guarda en memoria el borrador de venta (sin `localStorage`).
- **D-G02** Todo `fetch` usa la base relativa `/api` + la ruta exacta con barra final (`/api/libros/`); Nginx quita el prefijo (`proxy_pass http://${API_UPSTREAM}/;`). Nunca la URL ni el puerto del backend en el JS.
- **D-G03** Verificación: manual (G-01..G-07 + W3C) en el frontend; `pytest` en el backend.
- **D-G04** Selectores de autores y clientes: se cargan desde los listados `GET /autores/` y `GET /clientes/`, pidiendo páginas de `limit=100` y avanzando `offset` hasta recibir menos de 100 elementos. `GET /clientes/{id}` se usa para «recuperar el cliente por ID» (G-03) y `GET /libros/{id}` para el detalle. La consulta por ID no es el enfoque elegido para los selectores. Decidido por el grupo el 2026-11-10.
- **D-G05** Sin secretos en el repo ni en la evidencia: solo nombres de variables en archivos de ejemplo.
