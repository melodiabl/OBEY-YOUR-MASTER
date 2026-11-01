# Primeros pasos

Guía del código de implementación al 01/11/2026. El prefijo de tu servidor puede ser distinto de `!`. Las entradas documentadas existen en el inventario; esto no sustituye las aceptaciones funcionales pendientes en el plan.

## Encontrar ayuda y configurar

Abre `/info help` o `!help` para consultar las categorías y comandos disponibles. Un administrador puede abrir `/setup` y elegir el sistema que quiere configurar. Esta entrada central es distinta del reproductor musical. Los comandos `!setup-*` se mantienen por compatibilidad; no necesitas memorizar todos para empezar.

Seleccionar un canal o editar texto no siempre publica el cambio. Lee el resumen y la confirmación del asistente; cerrar o descartar no equivale a guardar. Si el bot informa que no pudo confirmar acceso o guardado, vuelve a abrir el ajuste y consulta lo activo antes de repetir. La aceptación completa de configuración, tickets, moderación y registros en dos servidores sigue en P2.

## Música y Me gusta

Entra en un canal de voz accesible para el bot y usa `/music play` o `!play` con título, artista o enlace. Los botones actúan sobre el reproductor del servidor; sus permisos dependen de tu canal y la configuración DJ. Si una acción queda sin confirmar, consulta lo que se está reproduciendo y la cola antes de repetirla.

Marca canciones con el corazón de OBEY. **Tus Me gusta** reúne esos corazones y aparece como colección automática entre las playlists: no importa los favoritos de tu cuenta Spotify. Usa `/playlist list` para verla y `/playlist show nombre: Tus Me gusta` para consultar sus canciones; `!playlist` conserva la entrada de texto. En la web, el centro `/app/` incluye Biblioteca y Tus Me gusta; el detalle de playlists es de consulta/reproducción y no un editor completo.

Las fuentes permitidas son Spotify, YouTube, YouTube Music y Apple Music; radio utiliza HTTP. Los Shorts se rechazan. La disponibilidad depende del catálogo y las capacidades del nodo; un enlace de Spotify no implica que Spotify entregue el audio. La migración musical, sincronización completa, continuidad y medición de latencia siguen pendientes en P1.

## Panel web

Usa la dirección que te facilite el operador de tu instancia. Tras iniciar sesión con Discord, `/app/` muestra los servidores administrables en los que está el bot; no ofrece acceso por conocer un ID. El centro Next/React convive con pantallas EJS que aún no se han migrado.

Bienvenida distingue edición local, borrador guardado y publicación. Su vista previa usa datos de ejemplo y no envía un mensaje real. Publicar requiere la confirmación y el acceso al canal correspondiente. Ante un conflicto, actualiza y compara antes de guardar; ante un resultado incierto, consulta el estado antes de reenviar.

Si te retiran un permiso, el panel puede dejar de mostrar el servidor o pedir que actualices la sesión. Un fallo al verificar acceso no concede acceso usando datos antiguos. Para informar de un problema, sigue [SUPPORT](../../SUPPORT.md); evita incluir tokens, cookies o contenido privado en capturas.
