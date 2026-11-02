# Mapa de los 32 módulos al panel interno

Las carpetas siguen siendo módulos del bot. En la web aparecen agrupadas por tareas para no crear un menú con 32 enlaces. Este es un mapa de navegación propuesto, no prueba de que cada módulo esté implementado.

| Nº | Módulo JS final | Nombre en interfaz | Área del panel |
|---:|---|---|---|
| 1 | `bot/modulos/estadisticas/` | Estadísticas | Analítica |
| 2 | `bot/modulos/solicitudes/` | Solicitudes | Comunidad |
| 3 | `bot/modulos/builder/` | OBEY Builder / Constructor | Constructor |
| 4 | `bot/modulos/automatizaciones/` | Automatizaciones | Automatización |
| 5 | `bot/modulos/automod/` | AutoMod | Seguridad |
| 6 | `bot/modulos/tarjetas/` | Tarjetas | Comunidad |
| 7 | `bot/modulos/colecciones/` | Colecciones | Comunidad |
| 8 | `bot/modulos/decoracion/` | Decoración | Constructor |
| 9 | `bot/modulos/economia/` | Economía | Comunidad |
| 10 | `bot/modulos/eventos/` | Eventos | Comunidad |
| 11 | `bot/modulos/feeds/` | Publicaciones | Automatización |
| 12 | `bot/modulos/diversion/` | Diversión | Comunidad |
| 13 | `bot/modulos/sorteos/` | Sorteos | Comunidad |
| 14 | `bot/modulos/niveles/` | Niveles | Comunidad |
| 15 | `bot/modulos/registros/` | Registros | Moderación |
| 16 | `bot/modulos/mensajes/` | Mensajes | Comunidad |
| 17 | `bot/modulos/migraciones/` | Migraciones | Herramientas |
| 18 | `bot/modulos/moderacion/` | Moderación | Moderación |
| 19 | `bot/modulos/musica/` | Música | Música |
| 20 | `bot/modulos/perfiles/` | Perfiles | Comunidad |
| 21 | `bot/modulos/recordatorios/` | Recordatorios | Automatización |
| 22 | `bot/modulos/roles/` | Roles | Comunidad |
| 23 | `bot/modulos/seguridad/` | Seguridad | Seguridad |
| 24 | `bot/modulos/destacados/` | Destacados | Comunidad |
| 25 | `bot/modulos/fijados/` | Mensajes fijados | Comunidad |
| 26 | `bot/modulos/sugerencias/` | Sugerencias | Comunidad |
| 27 | `bot/modulos/plantillas/` | Plantillas | Constructor |
| 28 | `bot/modulos/tickets/` | Tickets | Soporte |
| 29 | `bot/modulos/utilidades/` | Utilidades | Herramientas |
| 30 | `bot/modulos/verificacion/` | Verificación | Seguridad |
| 31 | `bot/modulos/voz/` | Voz | Música |
| 32 | `bot/modulos/bienvenida/` | Bienvenida | Comunidad |

## Navegación visible propuesta

**General:** Resumen, Constructor (Builder), Música.

**Gestionar:** Moderación, Seguridad, Registros, Tickets, Comunidad.

**Herramientas:** Automatizaciones, Estadísticas, Configuración.

Las páginas internas de cada área contienen pestañas para sus submódulos y estados de disponibilidad reales. No añadir funciones vacías solamente para llenar el menú.

## Builder y Decoración

`builder` es el orquestador de estructura y cambios; `decoracion` conserva la función específica de estilo y formato. No fusionar automáticamente datos/comandos sin comprobar sus contratos. `plantillas` puede tener consumidores fuera de Builder, de modo que su servicio será reutilizable en vez de crear una segunda biblioteca.

## Landing

La landing actual no forma parte del rediseño y no debe renombrarse ni sustituirse en esta fase.
