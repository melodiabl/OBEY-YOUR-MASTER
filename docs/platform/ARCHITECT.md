# Architect: propuestas conectadas al servidor

El primer flujo funcional permite consultar la estructura real, editar una propuesta, comparar los cambios y guardar un borrador privado. Está disponible en `/architect/:guildId`, enlazado desde la configuración del servidor; `/config architect` usa el mismo servicio para consultar la estructura y el borrador del usuario.

## Lectura y contrato

`snapshotGuild` consulta canales y roles con REST, conservando IDs reales, padres, orden, metadata básica y overwrites. Serializa bitfields como strings decimales; ninguna credencial o sesión forma parte del snapshot. El hash de estructura no cambia solo por consultar a otra hora. Esta lectura no es una transacción entre recursos: Discord puede cambiar mientras se leen.

El alcance se declara `structure_only`: no es un backup completo. Excluye mensajes, miembros, hilos y configuración OBEY. Los tipos avanzados de canal se conservan sin ofrecer su edición; los campos no capturados deberán incorporarse antes de una operación de restauración.

El blueprint versión 1 referencia la revisión de origen. Recursos nuevos usan IDs `local:<clave>`; los IDs existentes deben pertenecer al snapshot. La validación limita listas, nombres, tipos, padres y permisos, rechaza campos desconocidos y no permite omitir recursos existentes. Roles gestionados, `@everyone`, tipos avanzados y recursos protegidos se conservan. No hay eliminación implícita.

## API y persistencia

- `GET /api/architect/:guildId`: snapshot fresco y borrador privado del actor.
- `POST /api/architect/:guildId/preview`: valida la propuesta sobre una nueva lectura; devuelve diff y preflight parcial.
- `POST /api/architect/:guildId/draft`: lo anterior más persistencia, con `expectedRevision` para impedir sobrescrituras entre pestañas.

Todas las rutas exigen sesión, permisos OAuth actualizados y acceso administrativo a la guild. Las mutaciones reutilizan CSRF del dashboard. El actor sale de la sesión. Respuestas privadas `no-store`; body limitado a 1 MiB. Un cambio de estructura o una revisión de borrador obsoleta devuelve 409; una caída de Discord/DB devuelve 503, sin detalles internos.

`ArchitectDraft` utiliza índice único `(guildId, actorId)`. La primera escritura inserta una revisión 1; posteriores escrituras hacen CAS sobre la revisión previa y la incrementan en el mismo documento. No depende de transacciones Mongo. `model.init` espera al índice antes de operar. No se confirma guardado tras un fallo de almacenamiento. Un borrador anterior permanece en la DB aunque una estructura cambiada obligue a abrir una nueva propuesta. Solo un guardado confirmado lo reemplaza.

## Editor y revisión

El árbol permite seleccionar categorías, texto, voz y roles; el inspector edita nombres, tema de texto, padre y color del rol. Subir/bajar ofrece alternativa de teclado a drag and drop. Se pueden añadir recursos y quitar los nuevos mientras no haya dependencias. Deshacer/rehacer conserva hasta 20 estados. Los recursos existentes no se eliminan desde este editor. El contenido de Discord y de la propuesta se muestra con `textContent`.

El diff presenta antes/después para create, update, move y overwrites. La comprobación parcial consulta actores y bot con `force: true`, comprueba ManageChannels/ManageRoles, jerarquía y permisos que se pretende conceder. La ejecución básica comprueba acceso efectivo, límites de roles/canales/hijos y bitrate y ordena roles/categorías/canales. Preflight completo y configuración de módulos siguen pendientes. La ejecución se marca pendiente y el resultado no es una garantía.

## Verificación

```sh
node --test test/architect-*.test.js
node scripts/validate-commands.js
npm test
```

La evidencia de Chromium en `evidence/architect-browser.json` usa Express/EJS, sesión/CSRF, servicio, validación y diff reales, con REST Discord y repositorio de borradores aislados. Cubre edición, creación, movimiento, undo/redo, preview, guardado/recuperación, conflicto de dos pestañas, drift de Discord, texto seguro, denegación, escritorio y móvil sin overflow ni errores JavaScript.

MongoDB 7 en una red de contenedor sin conexión externa verificó inserts, recuperación, CAS concurrente, índice único y aislamiento por guild/actor. Las fixtures y contenedores se eliminaron. `scripts/verify-architect-storage.js` acepta únicamente una URI explícita de loopback a `obey_architect_test`, nunca la configuración Mongo de la aplicación. CI repite esa prueba con la imagen del runtime tras compilarla.

Referencias de la biblioteca actual: [permisos y overwrites de discord.js](https://discordjs.guide/legacy/popular-topics/permissions), [cachés de recursos](https://discordjs.guide/legacy/miscellaneous/cache-customization). Se verificó en el código instalado que `fetch` de miembros sin `force` puede devolver caché.

## Continuación del plan

T25/T26/T30 quedan parciales: existe el flujo de propuesta y borrador, con entrada Discord y web. Falta wizard de comunidades, plantillas, permisos completos de categorías/miembros, preflight completo y sincronización del explorador mediante eventos. T23/T24 incluyen cola, estado privado, leases por guild y checkpoints; T27 añade copias inmutables de estructura y T28 añade confirmación por revisión y aplicación limitada de nombres/temas/colores existentes. Ver [JOBS.md](JOBS.md), [RESTORE-POINTS.md](RESTORE-POINTS.md) y [APPLICATIONS.md](APPLICATIONS.md). Creaciones básicas con mapas de IDs reales y reconciliación positiva añadidas. Permisos de roles/texto/voz existentes e inspector añadidos, con acceso resultante comprobado en cada paso. Cambios de categoría de texto/voz conservando permisos añadidos. Orden de recursos existentes por lote añadido. Planes mixtos de orden, permisos de categorías, revisión manual de jobs terminales, configuración portable, restauración y rollback siguen pendientes. IA y temas conservan el alcance del maestro.

No se inició el bot, publicó el comando, conectó Discord real, usó Mongo de producción ni modificó estructura de servidores. Redis dedicado fue configurado por petición expresa (`REDIS.md`). La aplicación web solo se habilita para guilds canary configuradas; actualmente no hay ninguna habilitada. Tests de aplicación usan fixtures mutables y storage/cola reales aislados.
