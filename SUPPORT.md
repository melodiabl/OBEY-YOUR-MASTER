# Soporte

Estado comprobado el 01/11/2026. El repositorio es [melodiabl/OBEY-YOUR-MASTER](https://github.com/melodiabl/OBEY-YOUR-MASTER), pero **Issues y Discussions están desactivados**. Las plantillas del checkout no habilitan esos servicios. No se promete un tiempo de respuesta ni soporte permanente.

La invitación Discord del README anterior devuelve «invitación desconocida» (HTTP 404). No se publica como canal vigente. La página de WhatsApp responde, pero eso no confirma que el canal exista, atienda incidencias o sea un contacto privado de seguridad. **Falta que el mantenedor confirme un destino público de soporte y un contacto privado para vulnerabilidades.** G25 conserva ese pendiente.

## Si usas una instancia del bot

Contacta al administrador de esa instancia mediante el canal que ya tengas con él. Este repositorio no conoce el despliegue ni las credenciales de cada operador. Antes de comunicar un problema, consulta [primeros pasos](docs/user/INICIO.md) y comprueba el estado que muestra el bot.

Prepara lo siguiente para el contacto confirmado:

- Comando o pantalla, pasos y resultado esperado/observado.
- Fecha y hora con zona horaria; si se trata de música, título/enlace y qué ocurrió con la cola o el control.
- Si mantienes la instancia: commit, versión de Node y etiqueta de imagen.
- Error breve y captura con nombres, IDs y contenido privado ocultos cuando no sean necesarios.

No envíes `.env`, cookies, encabezados de autorización, tokens de Discord/OAuth, URI Mongo con credenciales, archivos privados de nodos ni respaldos completos. Para vulnerabilidades, consulta [SECURITY](SECURITY.md).

## Si mantienes una instancia

Consulta [instalación y persistencia](docs/operations/INSTALACION.md), [checkpoint](docs/platform/CHECKPOINT.md) y [problemas conocidos](CHANGELOG.md). El HTTP 200 de `/health` no demuestra reproducción de audio ni autorización de todas las funciones. Si un guardado o una acción musical queda incierto, consulta el estado antes de repetirla.
