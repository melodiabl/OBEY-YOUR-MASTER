# Configuración del bot · bienvenida

Entrega local del 12 de octubre de 2026. Sigue INICIAR_CODEX.md, contrato común y welcome.md del paquete consolidado. Integra la base de bienvenida previa sin revertir sus aliases, persistencia, tarjetas/DM o editores existentes. No se declara terminado el módulo welcome ni los 32 módulos.

Convención vigente: archivos por función sin `module-` al inicio. Servicio en `handlers/configuration-service.js`, registro en `handlers/feature-registry.js` y editor en `configuration-editor.*`. En la interfaz se usan nombres directos, como Bienvenida y Tarjetas.

## Recorrido conectado

En el dashboard de un servidor, **Bienvenida** abre `/configuration/:guildId/welcome`. Publicado → editar → vista previa con datos ficticios → guardar borrador → revisar diferencias → publicar. Guardar no modifica la bienvenida activa. Publicar comprueba revisiones y permisos de nuevo; un conflicto mantiene el texto y bloquea nuevas escrituras hasta actualizar/comparar. El borrador guardado se recupera al recargar. Revocar acceso elimina los datos de configuración mostrados por el editor.

La vista previa sustituye una sola vez las variables que soporta el renderer existente: user, username, usertag, guild, server y count. Se muestra como texto seguro, sin ejecutar HTML. No genera tarjetas ni envía mensajes a Discord. Cambiar el texto oculta una vista previa anterior para evitar confundirla con los cambios actuales.

Registro de módulos: welcome se añade como consumidor de configuración; music y architect conservan sus servicios. `resolveCapability` normaliza read/view a module.view y edit/manage/configure a module.configure; acciones de otro dominio o no declaradas no resuelven. El listado solo muestra manifests registrados y sus estados reales; no inicializa handlers ni concede permisos.

## API

Todas las rutas requieren sesión existente, permisos frescos de guild, guild instalada y capacidad administrativa. Mutaciones usan el middleware CSRF global. Actor del backend; no se aceptan actorId, roles o campos desconocidos en body.

| Método/ruta | Entrada | Resultado |
|---|---|---|
| GET `/api/guilds/:guildId/modules` | — | Metadatos de módulos registrados |
| GET `/api/guilds/:guildId/modules/welcome/config` | — | published, draft, draftRevision y lastPublication |
| GET `/api/guilds/:guildId/modules/welcome/channels` | — | Canales de texto visibles para el actor |
| PUT `/api/guilds/:guildId/modules/welcome/draft` | config {channelId,message}, expectedDraftRevision, expectedPublishedRevision | Borrador guardado sin efectos |
| POST `/api/guilds/:guildId/modules/welcome/preview` | config {channelId,message} | Texto de muestra y fixture=true |
| POST `/api/guilds/:guildId/modules/welcome/publish` | draftRevision, expectedPublishedRevision, operationId | Configuración persistida y borrador consumido |

Errores: 400 validación, 401 sesión, 403 permiso, 404 guild/módulo no disponible, 409 conflicto con snapshot current autorizado, 503 dependencia. Recurso inválido/inaccesible no se sustituye por otro canal. Preview y publicado se distinguen de borrador; no se guarda al mover el selector.

## Datos y compatibilidad

Mongo conserva la configuración activa existente y el borrador versionado en el mismo documento Guild. La publicación es una actualización atómica con comparación de valores, no una transacción con Discord. Preserva claves legacy desconocidas y configura únicamente canal/mensaje; no toca DM, segundo canal, colores o tarjetas. Revision publicada usa el hash existente; revision del borrador es monotónica. La consulta no inserta defaults en servidores migrados.

El registro de última publicación soporta reconciliar el último operationId mientras no lo sustituya una publicación posterior. No implementa aún retención de todas las operaciones de siete días ni historial/reversión de configuraciones. No hay realtime de configuración entre procesos: al volver al editor se consulta Mongo; escritores legacy existentes deben seguir el servicio compartido para actualizar su cache local.

## Verificación reproducible

Suite completa: `npm test`, 293 tests pasan, cero fallos y cero skip. Esquemas de comandos: 19 raíces, 166 subcomandos/grupos y un standalone, sin publicación. Sintaxis y `git diff --check` sin errores; no hay build ni linter definidos en package.json.

La suite también pasó desde una exportación limpia de los commits, reutilizando las dependencias locales y excluyendo los cambios pendientes de Architect. Los archivos que quedan sin confirmar pertenecen al trabajo previo; la entrega no depende de ellos.

```sh
node --test test/configuration-service.test.js test/configuration-api.test.js test/feature-registry.test.js test/welcome-configuration.test.js test/welcome-config.test.js
OBEY_CONFIG_TEST_MONGO_URL=mongodb://127.0.0.1:27029/obey_configuration_test node scripts/verify-configuration.js
node scripts/serve-configuration-fixture.js
node scripts/verify-configuration-browser.js http://127.0.0.1:PUERTO /ruta/al/modulo/playwright
```

El servidor imprime el puerto, usa solo fixtures en memoria y no inicia el bot. La prueba Mongo rechaza cualquier URL que no sea loopback con la base de pruebas exacta. Limpia únicamente registros de fixture creados en ese intento. Playwright es una herramienta de prueba disponible en este entorno; no se añadió una dependencia runtime. El MCP de Chrome no pudo iniciar como root y se usó Chromium aislado de Playwright.

Evidencia de navegador en `docs/platform/evidence/configuration/`: desktop.png, mobile.png y browser.json. Recorridos: preview seguro, draft sin activar, recuperación, publicación, conflicto entre pestañas conservando texto, fallo de persistencia conservando texto, revocación de acceso, teclado y anchos 320/768/1024/1440. Mongo real: conflicto entre instancias, publicación/aliases atómicos, conservación de DM/cards, reintento y detección de edición legacy.

No se reinició producción, no se ejecutaron comandos del bot contra Discord ni se subieron recursos. Los permisos Discord usados por las pruebas son fixtures. La comprobación con un servidor real, los demás campos y módulos, historial/retención y sincronización realtime siguen pendientes.

## Reversión y continuación

Revertir los commits propios de esta entrega conserva documentos legacy y borradores en Mongo; no eliminar datos nuevos. El lector antiguo ignora el campo adicional y sigue leyendo aliases publicados. Continuar con ayuda/contexto desde el registro y renderer de tarjetas/bienvenida; añadir adapters de configuración solo al conectar sus consumidores.

Decisión de almacenamiento y límites: [ADR 002](adr/002-configuration.md).
