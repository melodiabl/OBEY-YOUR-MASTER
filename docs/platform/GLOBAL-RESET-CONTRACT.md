# Contrato de resetsettings

Dos opciones, seguidas de confirmación explícita y caducable: configuración; configuración más datos locales. Acceso exclusivo a IDs exactos de propietarios del bot, con membresía/canal/bot actuales; sin ampliar privilegios del servidor.

Configuración: documento Guild (se conservan avisos legacy `warns`), JTC1/2/3, Roster, CustomCommand, Keyword y el registro de configuración Ranking cuyo recordKey coincide exactamente con guildId. Guild se sustituye por valores básicos válidos y embed legible. Los aliases del mismo SyncMap no se procesan varias veces.

Configuración y datos: lo anterior y Stats, UserProfile y registros Ranking con clave `guildId-userId` válida; también se limpian los avisos legacy embebidos en Guild. Esta opción afecta únicamente a los registros vinculados al servidor seleccionado.

Ambas opciones conservan Premium, colas/likes/playlists personales, blacklist de usuarios, economía, historial canónico de moderación, mutes y MusicGuild/MusicSession del motor actual. YouTube usa channelKey sin una asociación inequívoca al servidor: sus registros compartidos se conservan. No se borran recursos de Discord ni se detiene música. El texto previo enumera estos límites; no promete eliminar toda la base de datos.

La vista previa lee una instantánea consistente y entrega una revisión ligada al modo y servidor. Confirmar usa una transacción MongoDB con lectura snapshot y escritura majority, operaciones secuenciales y revisión coincidente. No hay alternativa de borrado parcial para servidores sin transacciones. Si cambia un registro entre vista previa y confirmación, se pide revisar otra vez. Un error de commit incierto nunca anuncia éxito ni reintenta otra operación por su cuenta.

Las colas de persistencia de los SyncMap afectados se adquieren en orden fijo y se deduplican. La captura de mutaciones empieza síncronamente al reservar cada cola, antes de esperar su ejecución o las colas siguientes. Se publican las cachés después del commit, reproduciendo los operadores de las escrituras legacy aceptadas durante la espera/transacción. Los payloads se copian al admitirse, conservando tipos BSON explícitos y números JavaScript ordinarios. La revisión y el límite usan BSON sin promoción numérica, no JSON. Set/ensure/remove/math usan upsert para que un borrado concurrente no convierta sus actualizaciones aceptadas en no-ops silenciosos. Math conserva el resultado absoluto calculado por su API legacy al admitirse; no recalcula aritmética sobre la nueva base. Las escrituras continúan al liberar las colas. No se publican cambios de una transacción abortada.

Límites de admisión: 5.000 registros por consulta y 8 MiB totales de instantánea. Un conjunto mayor no se borra automáticamente. Confirmación vinculada al actor, mensaje, servidor y token; primer clic reclama una operación, ACK antes de escritura, cancelación/vencimiento no escriben. Elegir modo solo abre la vista previa.

Pruebas: SyncMap/constructores reales y MongoDB de réplica aislado, sin credenciales, datos ni acciones de producción. Verificar los dos modos, aislamiento entre servidores, conservación, rollback tras fallo, conflicto, permisos revocados, doble clic, caducidad y entrega fallida. Recibos duraderos y aceptación autenticada de Discord permanecen en el plan global.

Los perfiles legacy indexados por usuario y estadísticas de clave concatenada sin vínculo inequívoco se conservan también en el modo de datos. Esta entrega no migra esas claves.
