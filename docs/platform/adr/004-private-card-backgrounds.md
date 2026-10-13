# ADR 004: fondos privados por servidor en un documento acotado

Fecha: 2026-10-13. Estado: aceptada para bienvenida y despedida.

Cada servidor guarda hasta tres fondos y sus cuatro destinos de uso en un documento CardAssets separado de Guild. Los binarios no entran en el precargado de SyncMap ni se publican como archivos estáticos. El límite de 4 MiB por PNG mantiene el documento por debajo de 16 MiB incluyendo metadatos. La cuota y la selección se actualizan juntas, sin una transacción entre colecciones.

La imagen se inspecciona, decodifica y vuelve a codificar a PNG en el mismo supervisor de procesos acotados. Se reduce a un máximo de 1772×720 conservando proporciones; metadatos originales no se copian. Guardar exige comprobar nuevamente la autorización después de ese trabajo. Nombre, bytes, dimensiones, hash y autor se almacenan solo para la gestión del fondo. Los IDs son UUID y cada lectura exige guildId; los bytes se recuperan por un único elemento de ese documento.

La revisión pública es un hash de guildId, generación y contador. El filtro Mongo incluye generación y contador; elimina actualizaciones perdidas y evita reutilizar una revisión después de una expiración/recreación. Un hash de imagen igual dentro del servidor no consume otra plaza. Se rechaza borrar un fondo referenciado y la elección de fondo actualiza sus expiraciones en la misma escritura. Las referencias no pueden apuntar a assets de otra guild.

Un fondo sin uso caduca a los siete días. Los activos no tienen expiración individual, pero el documento tiene una concesión renovable de treinta días. El runtime renueva esa concesión para guilds de su cache únicamente con conexión y DB listas; no interpreta una indisponibilidad temporal como retirada. La renovación no cambia la revisión de edición. Mongo TTL borra documentos vencidos; la limpieza horaria retira fondos individuales vencidos y aumenta la revisión. GuildDelete no marcado unavailable purga el documento del servidor. TTL y limpieza no garantizan borrado físico al instante; los assets vencidos dejan de estar accesibles por API inmediatamente.

Cada destino admite un ID privado, null para el fondo predeterminado o legacy para la configuración anterior. Elegir un fondo no cambia canal, texto, DM, avatar, marco o activación del sistema de bienvenida. La imagen activa está en CardAssets, no se duplica dentro de settings. Web y Discord consultan esa misma referencia dentro del cupo de render y usan la composición actual.

La API necesita sesión, permisos OAuth actuales y membresía con ManageGuild actualizada. Los bytes y previews no se cachean públicamente. Subir, seleccionar, borrar y previsualizar requieren CSRF; la subida usa cuerpo binario con límites de bytes, plazo de lectura y dos operaciones simultáneas, incluso si el cliente cierra la conexión. No hay importador de URLs libres, subida directa a Discord ni código/layers arbitrarios.

La cuota inicial es deliberadamente pequeña. Para ampliarla deben reconsiderarse el tamaño BSON, almacenamiento y concurrencia; no basta subir el contador. El documento no contiene otros datos de usuario, balances o tokens. Copias de seguridad y retención global de Mongo son responsabilidad del entorno existente, no se declaran implementadas aquí.

Fuentes: [atomicidad de Mongo](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/), [límite BSON](https://www.mongodb.com/docs/manual/reference/limits/#bson-document-size), [TTL](https://www.mongodb.com/docs/manual/core/index-ttl/). Verificado en Mongo aislado entre dos servicios y con Chromium sobre Express/EJS, sin Discord real.
