# Ayuda contextual de OBEY

Entrega local del 13 de octubre de 2026. La ayuda de prefijo y `/info help` consulta el mismo servicio que la página `/help/:guildId`. Se mantienen los comandos y aliases existentes. En el despliegue posterior de ese día el bot publicó sus 19 raíces slash; un GET a Discord confirmó `/info help`. Ver [registro de entrega](RELEASE-2026-10-13.md); la ejecución interactiva por un usuario sigue pendiente.

## Qué está conectado

El catálogo se obtiene de client.commands, sus aliases efectivos, client.allCommands y los handlers slash cargados. Una invocación slash conserva la raíz y sus subcomandos; no se inventa `/ban` cuando el schema expone `/moderation ban`. Los aliases que el router asigna a otro comando no se anuncian en el detalle.

La consulta vuelve a obtener el miembro y el bot mediante Discord. Cuando se elige un canal comprueba pertenencia al servidor y visibilidad. Filtra permisos declarados, roles heredados de administración, canales de bot/peticiones, voz, reproducción/historial y reglas DJ/solicitante. Oculta funciones marcadas inactivas y contenido restringido sin su configuración/contexto. Owner se conserva en el inventario pero se omite de la ayuda general: no se concede acceso a herramientas del operador por ser administrador de una guild.

Esto es disponibilidad contextual, no una autorización para ejecutar sanciones ni una certificación del proveedor externo. Jerarquías/objetivos, permisos internos de handlers legacy y requisitos específicos del comando se comprueban al ejecutarlo. Su normalización completa conserva T06/T53. No se añadieron toggles que permitan anunciar habilitación sin enforcement.

## Discord

- `!help comando`, con el prefijo del servidor; soporta aliases y búsqueda de una ruta slash completa.
- `/info help comando` reconoce primero la interacción de forma privada y después consulta permisos.
- Categorías en grupos de 25 y páginas de cinco comandos; navegación de categorías completa sin truncar el resto.
- Los controles comprueban actor, guild, mensaje y customId; revalidan membresía/contexto antes de dibujar otra página. Reconocen inmediatamente el click y serializan las consultas respetando el orden de llegada.
- Al caducar o fallar la verificación se retiran los controles; una respuesta tardía no restaura contenido/controles antiguos. Un tercero recibe una respuesta privada para abrir su propia ayuda.
- Embeds y campos acotados, contenido escapado, allowedMentions desactivado y recursos del resolver con fallback. Soundy conserva sus doce controles, fuentes y motor.

La ayuda de prefijo conserva la respuesta en el canal. El slash es privado. No se pretende reparar todos los mensajes de ayuda enviados previamente.

## Dashboard

El acceso **Ayuda** del servidor abre búsqueda, categoría, selector de contexto de canal y paginación. Los detalles muestran uso, aliases, permisos declarados y cooldown. Cada petición usa OAuth/sesión y permisos frescos existentes; además el servicio consulta la membresía actual. Revocar acceso elimina resultados y detalle de la interfaz. No ejecuta comandos ni escribe configuración desde esta página.

API: GET `/api/help/:guildId` con search, category, channelId, command y page; máximo 25 resultados por página. GET `/api/help/:guildId/channels` devuelve canales visibles de la guild autorizada. Validación de campos/longitud/tipos antes del servicio; respuestas 400/401/403/404/503 según fallo. No acepta actor/roles desde el navegador ni devuelve funciones, tokens o configuración privada.

## Verificación

Pruebas nuevas observadas fallar antes de implementar sus funciones; regresiones adicionales para consulta general sin canal, orden de clicks, caducidad y serialización de bitfields.

```sh
node --test test/help-catalog.test.js test/help-ui.test.js test/help-api.test.js
node scripts/verify-help.js
node scripts/serve-help-fixture.js
node scripts/verify-help-browser.js http://127.0.0.1:PUERTO /ruta/a/playwright
npm test
node scripts/audit-commands.js
node scripts/validate-commands.js
```

Suite completa: 306 pruebas pasan, cero fallos y cero skip. El test Socket.IO requiere ejecución con permiso de puerto local. El verificador de carga valida 812 invocaciones de catálogo (645 de prefijo, 167 slash), 19 raíces, 23 categorías y 372 entradas disponibles para su miembro ficticio. Este recuento de invocaciones no equivale a número de funciones independientes ni confirma ejecución en Discord. La auditoría de archivos carga 811 entradas sin errores/conflictos; schemas: 19 raíces y 166 subcomandos/grupos, un standalone, published=false.

Chromium aislado: Express/EJS y servicio reales, handlers/permisos de fixture. Búsqueda/alias, páginas, detalle, contenido HTML tratado como texto, cambio de rol, acceso revocado, foco de teclado y anchos 320/768/1024/1440; cero errores de página. Evidencia en `evidence/help/browser.json`, desktop.png y mobile.png. El MCP de Chrome no arranca como root en este entorno; se usa Playwright disponible sin añadir dependencias runtime.

## Pendiente y continuación

Corrección posterior: ambas copias heredadas de `addmoney` declaran `Settings` en UTF-8, sin el prefijo dañado `âš™ï¸`. La prueba carga esos archivos reales y el verificador comprueba todas las categorías del catálogo; no se recodifican mensajes ni nombres aportados por usuarios. El proceso desplegado del 13 de octubre incluye esta corrección; los mensajes antiguos conservan su contenido.

Comprobación con Discord real y OAuth real; permisos de handlers legacy todavía sin metadata completa; preferencias de todas las utilidades, idiomas y habilitación persistida/enforced. El registro utilities declara esas capacidades pendientes. El inventario no se usa para inicializar otro handler ni otro bot. Configuración cacheada es la del mismo proceso; no se promete realtime entre instancias.

Continuar con el renderer compartido de tarjetas y bienvenida según cards.md, conservando configuración/assets seleccionados. Reversión: revertir los commits de esta entrega, sin eliminar configuración, recursos o cambios locales anteriores; la ayuda no migra datos.

Fuentes comprobadas: [respuesta y defer de interacciones](https://docs.discord.com/developers/interactions/receiving-and-responding) y [componentes de Discord](https://docs.discord.com/developers/components/reference), contrastadas con los builders de la versión instalada.
