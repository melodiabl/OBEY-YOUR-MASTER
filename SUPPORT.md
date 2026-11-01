# Soporte

Estado comprobado el 01/11/2026. El soporte del proyecto se recibe en [GitHub Issues](https://github.com/melodiabl/OBEY-YOUR-MASTER/issues). Puedes [abrir una consulta o informar un fallo](https://github.com/melodiabl/OBEY-YOUR-MASTER/issues/new) con tu cuenta GitHub. Issues está habilitado y se verificó mediante la API del repositorio. Discussions permanece desactivado. No se promete un tiempo de respuesta ni soporte permanente.

Para vulnerabilidades, usa el [formulario privado de seguridad](https://github.com/melodiabl/OBEY-YOUR-MASTER/security/advisories/new), cuyo estado habilitado también se verificó por API. No envíes una vulnerabilidad a una incidencia pública; consulta [SECURITY](SECURITY.md).

La invitación Discord anterior está vencida y no se presenta como canal vigente. El canal WhatsApp histórico no se usa como contacto de soporte o seguridad. Las plantillas de esta rama están actualizadas; GitHub utiliza las de la rama predeterminada en su selector. El enlace de consulta anterior abre el formulario genérico y no depende de esas plantillas.

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
