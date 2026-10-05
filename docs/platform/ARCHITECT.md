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

T25/T26/T30 quedan parciales: existe el flujo de propuesta y borrador, con entrada Discord y web. Asistente de bases de comunidad añadido; faltan conexión automática de módulos, biblioteca de plantillas, permisos completos de categorías/miembros, preflight completo y sincronización del explorador mediante eventos. T23/T24 incluyen cola, estado privado, leases por guild y checkpoints; T27 añade copias inmutables de estructura y T28 añade confirmación por revisión y aplicación limitada de nombres/temas/colores existentes. Ver [JOBS.md](JOBS.md), [RESTORE-POINTS.md](RESTORE-POINTS.md) y [APPLICATIONS.md](APPLICATIONS.md). Creaciones básicas con mapas de IDs reales y reconciliación positiva añadidas. Permisos de roles/texto/voz existentes e inspector añadidos, con acceso resultante comprobado en cada paso. Cambios de categoría de texto/voz conservando permisos añadidos. Orden de recursos existentes por lote añadido. Asistente web con diez bases, siete temas para recursos nuevos, idioma/tamaño/decoración y espacios de bienvenida/música conectado a propuesta, diff, undo y borrador privado. Permisos de una categoría con cascada revisada añadidos. Planes mixtos de orden/cascadas múltiples, revisión manual de jobs terminales, configuración portable, restauración y rollback siguen pendientes. IA y temas conservan el alcance del maestro.

No se inició el bot, publicó el comando, conectó Discord real, usó Mongo de producción ni modificó estructura de servidores. Redis dedicado fue configurado por petición expresa (`REDIS.md`). La aplicación web solo se habilita para guilds canary configuradas; actualmente no hay ninguna habilitada. Tests de aplicación usan fixtures mutables y storage/cola reales aislados.

## Asistente de estructura

`handlers/architect/wizard.js` ofrece bases gaming, comunidad, anime, música, creativos, desarrollo, estudio, roleplay, soporte y personalizado. El catálogo llega desde el servidor; cada solicitud valida base, tema, tamaño, idioma (es/en/pt), decoración y espacios opcionales. Siete temas (Midnight, Minimal, Sakura, Nebula, Gaming, Luxury y OBEY) decoran nombres de los recursos nuevos y el color del rol Miembro. No cambian el tema de la aplicación ni retocan recursos existentes.

`POST /api/architect/:guildId/generate` usa la autorización y CSRF existentes. Recarga la estructura, valida la revisión y la propuesta actual, genera IDs lógicos y devuelve el mismo blueprint/diff/preflight del editor. Conserva recursos existentes, ediciones y protecciones; reutiliza recursos por ID lógico o nombre/tipo/padre compatibles. Una categoría privada/protegida bloquea añadir hijos de forma implícita. No guarda ni ejecuta al generar: guardar usa el repositorio privado CAS; aplicar usa la confirmación y worker existentes. Repetir la misma base no duplica recursos; después de aplicar, los nombres/tipos/padres compatibles permiten reutilizar sus IDs reales. Cambiar elecciones conserva recursos ya presentes; Deshacer permite retirar la base recién añadida.

La web organiza primero asistente, luego editor/revisión y después trabajos/copias. Las comprobaciones correctas se pueden desplegar; errores y pendientes quedan visibles. Hay instrucciones de loading/error, selección personalizada, teclado y layout móvil. Los espacios de bienvenida/música son estructura: `configuresModules: false` y el aviso de UI conservan explícitamente pendiente la conexión de módulos. T30 sigue parcial; no se presenta como wizard integral ni Theme Engine/Template Library terminados. IA, configuración portable, aplicación general de temas y módulos siguen en el maestro.

Evidencia: `architect-wizard-desktop.png`, `architect-wizard-mobile.png` y `jobs-browser.json`. Chromium usa Express/EJS/sesión/CSRF/Mongo/Redis reales y un proveedor Discord controlado. Verifica base/idioma/tema/tamaño/decoración, editor/diff, generación sin efectos ni guardado implícito, borrador privado, recuperación en otra pestaña, repetición sin duplicados, undo y móvil. Pruebas unitarias generan propuestas válidas y compilables para las diez bases; opciones inválidas, drift, preservación y colisiones privadas se bloquean.

## Decoration Studio por alcance

`handlers/architect/themes.js` comparte los siete presets entre asistente y decoración. `POST /api/architect/:guildId/decorate` autentica/autoriza como las demás propuestas, valida opciones/revisión contra estructura fresca y devuelve blueprint/diff/preflight. `handlers/architect/decoration.js` modifica únicamente nombres y colores simples de roles. No cambia IDs, tipo, padres, orden, permisos, topics, ni crea/elimina recursos. El usuario elige recurso, categoría con sus canales, roles o servidor completo. Sin decoración/solo categorías/expresiva controla los prefijos; se sustituyen prefijos de presets conocidos y se conservan símbolos personalizados. Nombres vacíos o mayores de 100 caracteres bloquean el resultado completo, sin truncar nombres. Repetir el mismo tema no acumula prefijos.

Protecciones explícitas, everyone/managed, hijos de categorías protegidas y tipos avanzados se conservan y aparecen en la lista de omitidos. Roles con estilos desconocidos, gradientes u holográficos se conservan completos. No se ofrecen cambios de iconos, colores especiales ni opciones premium. Preflight del motor común vuelve a comprobar jerarquía y acceso al preparar/aplicar.

La interfaz muestra alcance/selección, antes/después y motivos de conservación. Previsualizar incorpora los cambios solo al editor y retira cualquier confirmación preparada. Undo, borrador privado y aplicación confirmada utilizan los servicios existentes. Tests contrastan que los únicos cambios relativos a la propuesta de entrada sean name/color para los siete temas y los cuatro alcances. Chromium comprueba preview sin efectos, roles protegidos reportados, repetición, undo, móvil y confirmación efectiva de nombre/color con copia previa y checkpoints. Proveedor Discord controlado, Mongo/Redis reales aislados; no aceptación canary. Capturas: `architect-decoration-desktop.png`, `architect-decoration-mobile.png`. T31 sigue parcial: acceso directo fuera de Architect, entrada Discord y aceptación real pendientes.
