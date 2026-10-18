# Avisos y descarte de los setups · 19/10/2026

El usuario informó que `!setup` terminaba mostrando «No pude confirmar el acceso o el guardado» y, en otra ocasión, el aviso del asistente de idioma. Esos mensajes genéricos no identificaban la causa y los catch no dejaban evidencia suficiente. No se ha confirmado todavía el servidor/canal ni reproducido ese fallo original en datos reales; no atribuirlo a permisos o Mongo sin observarlo.

La reproducción con Client, Guild, GuildMember, TextChannel, Message, interacciones y collectors reales de discord.js sí encontró un defecto concreto: al volver desde idioma con una selección pendiente se pedía Descartar cambios, pero no había botón para hacerlo. Ahora existe Descartar cambios, limpia solo la selección local y permite volver. No escribe ni cambia el idioma guardado. Se conserva la autorización fresca.

Los errores del menú central, selector de asistentes/espacios, formulario, idioma y sesión se clasifican al responder. Se distinguen permisos del actor/acceso al canal, permisos del bot, lectura/guardado y arranque/cierre. Las comprobaciones y permisos exigidos se conservan; no se concede acceso adicional. Para los fallos inesperados se mantiene una respuesta genérica. El registro `[Setup]` contiene solo el área, tipo/código permitido y ubicación de código; omite el mensaje de error original, tokens, IDs y documentos.

## Verificación

23 grupos temporales comprueban `!setup` → tickets → borrador → bloqueo al volver → descartar → volver; idioma → selección → descartar → volver; el recorrido privado `/setup` editando su webhook; cierre, errores de permisos/arranque/Mongo y mensajes en es/en. Se verificó que descartar no genera escrituras y que los registros no incluyen secretos de ejemplo. La reproducción falló antes del cambio por ausencia de `language_discard` y pasa después. Pasan además los 25 tests originales, tipos y reglas de dependencias. [Evidencia](../platform/evidence/setup-errors-local.json).

La prueba utiliza datos locales y dobles solo para persistencia/red: no abre Gateway, no toca datos de producción y no sustituye el recorrido del usuario. El verificador temporal se retira al cerrar la entrega. El estado de despliegue se registra aparte. El error original de acceso/guardado permanece pendiente de una reproducción ubicada.
