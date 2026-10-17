# Piloto: configuración de canal y mensaje de bienvenida

Entrega local del 18/10/2026 sobre c8ba6d3; guía incorporada en a05036a. Implementación acotada a la operación ya existente, sin activar los 32 dominios propuestos. ARCH-02/03/05/06 y TECH-01/02/03 avanzan por esta capacidad; los criterios globales siguen abiertos en PLAN_POR_ETAPAS.md.

## Inventario del piloto · ARCH-02 / TECH-01

| Entrada real | Adaptador | Operación / estado |
| --- | --- | --- |
| GET /api/guilds/:guildId/modules/welcome/config | dashboard/configuration-routes.js | read; publicado y borrador separados |
| PUT .../welcome/draft | mismo adaptador | saveDraft; no activa |
| POST .../welcome/preview | mismo adaptador | preview sintético; no envía |
| POST .../welcome/publish | mismo adaptador | publish; CAS y recibo existentes |
| GET/POST /api/config/:guildId/welcome | dashboard/welcome-routes.js | readPublished / savePublished, alias conservado |
| GET/POST /dashboard/:guildId | dashboard/index.js | lectura y guardado de canal/mensaje; resto del formulario sigue legacy |
| /welcome canal | slashCommands/Welcome/canal.js | savePublished del canal |
| /welcome mensaje | slashCommands/Welcome/mensaje.js | savePublished del texto |
| !setup-welcome: Set/Overwrite Channel, Disable Welcome, mensaje | commands/Setup/setup-welcome.js | savePublished; revalida después del collector |
| guildMemberAdd | handlers/welcome.js | entrega existente; lector de caché/aliases, sin migrar el evento |
| guildMemberRemove | handlers/leave.js | despedida existente, fuera del piloto |
| Opciones de imagen, DM, segundo canal, roles/captcha | setup-welcome y handlers/welcome.js | legacy identificado, no migrado ni declarado terminado |

El loader prefix es handlers/command.js y el slash es handlers/slashCommands.js; events/guild/interactionCreate.js delega mediante executeSlashCommand. Se conservan nombres, aliases y opciones. No hay un job ni customId nuevo para esta operación. El menú prefix utiliza collectors existentes, no un segundo router.

El propietario de configuración es bienvenida. Fuente canónica: documento Guild y filtro atómico de welcome-configuration; configuración activa en welcome.channel, welcome.msg/message, welcomeChannel y welcomeMessage; revisión hash más welcomeConfigRevision; borrador en configurationDrafts.welcome y recibo en welcomeConfigLastWrite. SyncMap conserva caché, cola de escrituras y flush. No se añade colección ni migración.

Recursos: editor configuration-editor.ejs/js/css y formulario guild.ejs; catálogos locales/es.json, locales/en.json y languages legacy; renderer welcome-message.js y tarjetas actuales. No se añade texto ni material decorativo al panel. Los textos/errores legacy no se presentan como un catálogo i18n ya migrado.

## Límite público · ARCH-03 / ARCH-05

API autorizada en client.welcomeConfiguration y en el registro welcome. Factory en handlers/welcome/service.js, contratos en contract.js y puertos en ports.d.ts. La composición en handlers/configuration.js inyecta dos repositorios existentes y políticas Discord; el servicio no recibe client, req, Interaction o colecciones.

El contexto contiene exclusivamente guildId y actorId derivados por el adaptador. El cuerpo no puede decidir actor, permisos o guild. Cada operación revalida ManageGuild consultando el miembro con force:true. La publicación y el guardado directo verifican además el canal efectivo, su pertenencia, visibilidad y permisos del bot; quitar el canal también revalida al actor. Cambiar solo el texto valida el canal ya publicado. Si cambia la configuración durante esa comprobación, el CAS rechaza el guardado en lugar de aplicar sobre un canal diferente.

read/readPublished, saveDraft, preview, publish y savePublished comparten la política. Los helpers de escritura de config-service ya no tienen consumidores y se retiran; su lector compatible permanece. La propiedad pública anterior moduleConfiguration exponía el repositorio sin contexto: las entradas incluidas pasan al servicio autorizado y el repositorio queda en la composición.

Los contratos Zod son estrictos: config completa, patch no vacío, límite de 500 unidades UTF-16 de la versión fijada, revisiones y operationId existentes. Se rechazan campos desconocidos y undefined explícito. validatePatch sigue exportado por compatibilidad, ahora delega al mismo contrato; normaliza nochannel a null como antes. La descripción JSON Schema se deriva de configSchema y se publica en los metadatos del registro, sin duplicar límites de campos.

Las respuestas HTTP mantienen sus formas. Una escritura satisfactoria devuelve lo confirmado por Mongo; no significa que se haya enviado una bienvenida a Discord. Guardar un borrador no activa. Los conflictos conservan el estado actual autorizado. La revocación al leer un conflicto devuelve 403 sin exponer el snapshot.

Diferencia deliberada: los dos slash de configuración difieren su respuesta privada antes de consultar permisos/almacenamiento y completan con editReply. La confirmación de recepción no significa guardado. Se mantienen textos, nombres y opciones; la configuración deja de publicarse en una respuesta visible para todo el canal.

## Tecnologías y comprobación

- Zod 4.1.12 (MIT), dependencia runtime; TypeScript 5.9.3 (Apache-2.0), solo desarrollo. Dos incorporaciones, sin actualizar dependencias anteriores. Instalación sin scripts de paquetes; lockfile generado por npm. Auditoría npm sin entradas para esas dos dependencias; no se afirma auditoría limpia de todo el árbol legacy.
- Node probado 22.23.2. engines corregido de >=20 a >=22.12.0, requisito ya impuesto por voice en el lockfile. Docker/CI conservan su línea 22; no se ha hecho un despliegue ni validado una nueva imagen.
- npm run typecheck:welcome: strict/noEmit en contract.js, service.js y error.js mediante @ts-check y puertos explícitos. checkJs false evita atribuir comprobación al legacy importado; el formatter compartido conserva inferencia y pruebas de comportamiento. No hay any/casts/supresiones añadidos. No se afirma tipado completo del repositorio.
- Instalación limpia npm ci --ignore-scripts en una carpeta temporal: exit 0, versiones exactas verificadas, carpeta retirada. No acredita build de addons nativos, OAuth ni arranque completo.
- Paridad de validatePatch antiguo/nuevo en 231 combinaciones de límites: mismo valor normalizado o mismo código de error, incluidos null, undefined, campos desconocidos, nochannel y emoji largos.
- 15 escenarios contra Mongo aislado en loopback: dos instancias y CAS, borrador sin activar, publicación/replay, actor cambiado, aliases y ajustes avanzados, revocación de seis operaciones, canal inaccesible/ajeno, cuerpo con actor falsificado, límite UTF-16, revisión vieja, aislamiento guild, preview sintético, quitar canal autorizado y almacenamiento caído. Bases de pruebas creadas vacías para este intento y eliminadas después; no se accedió a la base del bot.
- 16 peticiones HTTP reales en loopback: 200/400/401/403/404/409, paridad de alias, borrador/publicación, revocación y recursos inexistentes. Cliente Discord y permisos simulados; no OAuth real.
- Slash mensaje ejecutado con interacción simulada: ACK privado antes del guardado, texto persistido y permiso revocado sin escritura. Flujo canal equivalente conectado; collectors prefix y formulario general revisados estáticamente, no recorrido real de Discord.
- AST de imports del área nueva: sin Express, discord.js, Mongoose, cliente global o repositorios privados. Reglas de dependency-cruiser persistentes pendientes de TECH-06.
- Suite original: 25/25 pasan. No se restauran los 122 tests ni los 28 scripts retirados. Las comprobaciones de esta entrega se ejecutaron como programas temporales/stdin y no se añadieron al repositorio.

Fuentes consultadas para la adopción: [Zod: contratos](https://zod.dev/api), [JSON Schema](https://zod.dev/json-schema), [TypeScript: comprobación de JS](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html), [discord.js: GuildMemberManager](https://discord.js.org/docs/packages/discord.js/14.27.0/GuildMemberManager:Class). La compatibilidad se comprobó con las versiones fijadas, no se deduce de documentación de versiones posteriores.

## Pendientes y rollback

Actualización TECH-04: [formulario declarativo](FORMULARIO_BIENVENIDA.md) implementado localmente en `c627d2f3a3ed5a6da76c65e58cb67739a13f7589`. Pendientes: ciclo de vida TECH-05/ARCH-04, reglas persistentes/imports y API TECH-06, recorridos reales autorizados de Discord/OAuth, tipado de adaptadores/repositorios, cobertura de la configuración avanzada, historial de operaciones más allá del último recibo y realtime entre procesos. Los cuatro casos generales de MOD-WELCOME (entrega/deduplicación/recuperación/privacidad de todo el módulo) no están cerrados por este piloto.

Revertir el commit del piloto y reinstalar el lockfile previo revierte código y dependencias. No se cambió formato de almacenamiento: lectores anteriores siguen usando los aliases y desconocen el borrador como antes. No borrar documentos, recibos o preferencias para revertir. El rollback de código no restaura permisos revocados ni publicaciones que el administrador haya realizado después.

Música y producción siguen en su estado anterior a esta entrega; el refactor de bootstrap del ZIP permanece separado. La latencia musical documentada no se declara resuelta por estos cambios.
