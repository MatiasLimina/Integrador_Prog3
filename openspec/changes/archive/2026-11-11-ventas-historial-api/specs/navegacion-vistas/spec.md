# Spec Delta

## REMOVED Requirements

### Requirement: Aviso de maqueta de la etapa 1
**Reason**: Con este change las cinco vistas operan contra la API y guardan en PostgreSQL: ya no hay datos de ejemplo ni operaciones pendientes que avisar. El HTML actual tampoco tenía el aviso (brecha registrada en I-02).
**Migration**: El pie de cada vista indica «datos ficticios servidos por la API de la librería»; la regla `.aviso-maqueta` sin uso se quita de `estilos.css`.
