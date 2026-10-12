# Remodelación OBEY · primera entrega local

Fuente: `/home/OBEY_Documentacion`, edición consolidada del 11 de octubre de 2026. Base de código: `9f11a85`, rama `feature/obey-main-implementation`. Los cambios locales previos de bienvenida, configuración, Architect y evidencias se conservaron y no forman parte de este incremento.

## R01–R03 · recursos y consumidores activos

Módulos afectados: infraestructura compartida de assets y consumidor music. Criterios: claves seleccionadas, compatibilidad de aliases, IDs por aplicación, hash/tipo correctos, ausencia/borrado con fallback, sincronización sin duplicar ni perder checkpoints. Configuración: mapa privado OBEY_EMOJI_MAP_FILE/DISCORD_CLIENT_ID; no se cambia configuración por guild ni datos de usuario. El único permiso externo de este incremento es el listado de emojis de la aplicación por el bot. Subida permanece en la CLI explícita y no se ejecutó.

- Registro existente ampliado con 103 claves y 89 aliases. Importación de 324 rutas únicas seleccionadas por destino, con hashes y metadatos de origen. No hay un registro runtime competidor; assets antiguos permanecen para mapas v1.
- Resolver de claves canónicas/aliases, objetos de componente y markup animado. Archivos ausentes, hashes/tipos distintos, aplicación ajena o disponibilidad negada producen fallback.
- Sync v2 de 82 emojis (72 PNG, diez GIF), MIME correcto, lector v1, conservación de recursos previos válidos, recuperación de respuesta perdida y fallo individual sin borrar recursos remotos. No downgrade a v1.
- Listener ClientReady, actualización cada cinco minutos, consulta agrupada y apagado seguro. Música conserva sus doce customId, labels/estados, disposición, motor y fuentes; sus textos dejan de guardar una copia estática del emoji al arrancar.

## Verificación

Entorno: Node 22.23.2, dependencias locales existentes, sin instalar paquetes ni arrancar el bot. Pruebas con fixtures y adaptadores de API; ninguna llamada de subida real.

- Tests nuevos escritos y observados fallar antes de implementar sus funciones.
- `node --test test/obey-material-import.test.js test/obey-selected-assets.test.js test/obey-selected-emoji-sync.test.js test/obey-assets-lifecycle.test.js test/obey-assets.test.js`: importación, integridad, rutas, alias, mapa v1/v2, GIF, respuesta perdida, fallos parciales, disponibilidad, agrupación y apagado.
- `npm test`: 280 tests, 280 pasan, cero fallos/skip. La prueba Socket.IO requiere abrir un puerto local y se ejecutó fuera del sandbox. El fallo inicial EPERM se reprodujo y la misma prueba pasó con ese permiso, sin modificarla.
- `node scripts/import-obey-materials.js /home/OBEY_Documentacion --check`: 103 claves, 89 aliases, 82 emojis y 324 archivos iguales al paquete.
- `node scripts/obey-assets.js`: validación local de los 82 recursos y plan sin escrituras externas.
- `node scripts/audit-commands.js`: 811 módulos de comando cargados, cero errores y cero conflictos. Es auditoría de carga, no ejecución de esos comandos.
- `node scripts/validate-commands.js`: 19 comandos raíz, 166 subcomandos/grupos de primer nivel, un standalone; published=false.
- Sintaxis de archivos modificados y `git diff --check` sin errores. No hay build de compilación ni linter definidos en package.json.

## Límites y continuación

El listener está conectado al arranque, pero el bot no se reinició ni desplegó. Comprobación visual y permisos reales, upload de emojis, reanudación con API real y paneles Discord quedan pendientes de un entorno de prueba autorizado. El mapa se recarga al reiniciar; la lista remota se renueva cada cinco minutos. Los renders y editores de los otros módulos siguen pendientes; no se declara ningún módulo completamente cerrado.

Continuar con capacidades y configuración versionada por módulo, respetando la publicación optimista de bienvenida ya presente como cambio local. Después ayuda/utilities y tarjetas/bienvenida según contratos. No activar medios de cobro ni reemplazar avatar/banner o controles Soundy.

Reversión local: revertir exclusivamente el commit de este incremento; no tocar las modificaciones previas. Si se generan mapas v2 en un entorno de prueba, conservar el mapa original v1 y no usar un lector antiguo con un mapa v2. La herramienta no borra emojis de Discord y legacyEmojis conserva los IDs anteriores válidos para conciliación.

Fuentes primarias comprobadas el 12 de octubre de 2026: [Emoji Resource](https://docs.discord.com/developers/resources/emoji) para formatos, tamaño, objetos y endpoints; [API Reference](https://docs.discord.com/developers/reference#message-formatting) para markup estático/animado. Fetch del listado verificado también contra ApplicationEmojiManager de la versión discord.js instalada.
