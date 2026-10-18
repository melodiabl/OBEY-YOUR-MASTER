# Reglas al entrar al servidor y a voz

Entrega local de joinvc/joinlist; acumulado 39/63, sin despliegue. Un selector inicial conduce al editor correspondiente. Selector paginado, guard y sesión propios; al elegir, cierra el menú padre y abre un mensaje nuevo para el editor. No comparte collectors vivos ni custom IDs globales.

Joinvc conserva vcmessages `{channelId,textChannelId,message}` y vcroles `{channelId,roleId}`. Formularios validan voz/stage, canal de texto y permisos/jerarquía del rol. No entra en voz ni asigna roles durante la configuración.

Joinlist conserva los seis arrays bajo joinlist: nombre contiene/coincide, ID de usuario, otro servidor en común/no en común y sin avatar. Cada entrada mantiene data/action y days/time/nickname según corresponda. Se admiten kick, ban, timeout y setnickname; bot con permiso de la acción, nickname hasta 32 y timeout hasta 28 días, días de borrado 0–7. Los consumidores y sus efectos siguen separados del guardado.

Ambos reutilizan editor de entradas, borradores, validación, CAS y bloqueo tras conflicto antes de recargar. Otros tipos/arrays y metadatos no se sustituyen.

Cinco grupos Mongo/SDK temporales: formularios/idiomas, tipos de canales, roles conservando mensajes, formatos/límites de reglas y actualización de un solo tipo. Además cuatro grupos de navegación con SDK real, 60 opciones, otro actor, mensaje hijo separado, permisos revocados y 100 ciclos sin listeners sobrantes. Bases propias eliminadas; no pruebas/scripts permanentes añadidos. Pruebas de editores anteriores, originales, imports/tipos y diff comprobados. Sin Gateway, sanciones ni voz reales.
