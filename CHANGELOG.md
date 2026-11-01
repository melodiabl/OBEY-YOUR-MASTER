# Cambios de OBEY

Registro de entregas verificadas en este checkout; no equivale a releases publicadas en GitHub. La historia Git, los informes fechados y el [checkpoint](docs/platform/CHECKPOINT.md) conservan los incrementos anteriores. La versión `14.0.0` del manifest no identifica por sí sola una imagen o entrega.

## 01/11/2026 · documentación pública

Comprobación posterior de base en `5703f837`: instalación limpia y build sin caché con Node22.23.4; cargadores reales e inventario coincidentes, 95 rutas y tests originales aprobados. CI amplía sus ramas objetivo, verifica frontend y auditorías y compara los cargadores reales sin login. Ver [el informe del corte](docs/platform/P0-FINAL-VERIFICATION-2026-11-01.md). Los cambios permanecen locales, sin ejecución remota de CI ni despliegue nuevo; P0 conserva sus pendientes externos.

README, índice, instalación, uso, contribuciones y avisos conciliados con el código actual. README anterior archivado sin modificar y entradas del paquete diferenciadas del runtime. Se corrigen instrucciones de instalación y fuentes de música; el soporte Discord vencido y los servicios GitHub desactivados se señalan explícitamente. Contactos de soporte/seguridad pendientes de confirmación. Esta entrega documental no reinicia ni despliega el bot.

## 31/10/2026 · sesiones y acceso web · `2355287f`

Sesiones y estado OAuth protegidos frente a escrituras antiguas; cierre de sesión invalida también el sucesor de una respuesta tardía. Los permisos de servidores se consultan de nuevo sin autorizar con una lista obsoleta. Estadísticas públicas mínimas y stream autenticado. Desplegado con 40 casos nuevos, 25 originales y 13 escenarios de navegador aislado. [Informe y límites](docs/platform/P0-SESSION-2026-10-31.md).

## 31/10/2026 · fronteras sensibles · `debad1e8`

Reglas de sorteos sin interpolación de código y con persistencia; listado privado de servidores con dueño vigente; restauración ligada a copia, destino y confirmación. Catorce comandos y ocho audios señalados retirados, conservando Fun. Desplegado y verificado según [P0-C2](docs/platform/P0-SECURITY-2026-10-31.md); rotación Mongo en el proveedor aún pendiente.

## Problemas y aceptaciones pendientes

- P0 continúa abierto: rotación Mongo externa, contacto público/privado real y corte final G01/G02/G25.
- P1 conserva migración a lavalink-client, continuidad de cola/audio, controles, sincronización y medición de latencia. Un Lavalink conectado o `/health` saludable no certifica estos recorridos.
- P2 conserva aceptación completa de setups, tickets, moderación, bienvenida y logs entre dos servidores. La revisión de middleware no acepta por arrastre esas funciones.
- Next/React está incorporado parcialmente; convive con EJS. Las letras, fuentes/plugins y nodos públicos no tienen una garantía global de sincronización o disponibilidad.
- Premium/pagos, recuperación distribuida y expansión siguen sus fases. No hay aceptación de pagos ni de escalado por publicar documentación.
