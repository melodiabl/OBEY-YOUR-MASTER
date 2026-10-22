# Fuentes y límites de la revisión

Consulta: 22/10/2026, America/Asuncion. Se utilizan documentación Discord y páginas versionadas del proyecto discord.js. La especificación de producto, secuencias, políticas y casos de aceptación de esta entrega son decisiones de diseño para OBEY.

| Clave | Fuente |
| --- | --- |
| components | [Fuente primaria](https://docs.discord.com/developers/components/reference) |
| overview | [Fuente primaria](https://docs.discord.com/developers/components/overview) |
| modals | [Fuente primaria](https://docs.discord.com/developers/components/using-modal-components) |
| commands | [Fuente primaria](https://docs.discord.com/developers/interactions/application-commands) |
| interactions | [Fuente primaria](https://docs.discord.com/developers/interactions/receiving-and-responding) |
| emoji | [Fuente primaria](https://docs.discord.com/developers/resources/emoji) |
| formatting | [Fuente primaria](https://docs.discord.com/developers/reference) |
| channels | [Fuente primaria](https://docs.discord.com/developers/resources/channel) |
| polls | [Fuente primaria](https://docs.discord.com/developers/resources/poll) |
| events | [Fuente primaria](https://docs.discord.com/developers/resources/guild-scheduled-event) |
| automod | [Fuente primaria](https://docs.discord.com/developers/resources/auto-moderation) |
| threads | [Fuente primaria](https://docs.discord.com/developers/topics/threads) |
| gateway | [Fuente primaria](https://docs.discord.com/developers/events/overview) |
| permissions | [Fuente primaria](https://docs.discord.com/developers/topics/permissions) |
| webhooks | [Fuente primaria](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) |
| containerBuilder | [Fuente primaria](https://discord.js.org/docs/packages/discord.js/14.27.0/ContainerBuilder:Class) |
| modalFields | [Fuente primaria](https://discord.js.org/docs/packages/discord.js/14.27.0/ModalSubmitFields:Class) |
| fileBuilder | [Fuente primaria](https://discord.js.org/docs/packages/builders/1.14.1/FileUploadBuilder:Class) |
| checkboxBuilder | [Fuente primaria](https://discord.js.org/docs/packages/builders/1.14.1/CheckboxBuilder:Class) |
| radioBuilder | [Fuente primaria](https://discord.js.org/docs/packages/builders/1.14.1/RadioGroupBuilder:Class) |

## Hechos técnicos resumidos

La referencia de componentes documenta selectores, campos de archivo, radio y casillas en modales, así como componentes de layout. La disponibilidad en el SDK se comprobó documentalmente en las páginas versionadas citadas. No se probó una sesión móvil/desktop de Discord ni el parser instalado.

El resumen de componentes documenta convivencia del modo legacy con V2 por mensaje. En V2 cambia el formato admitido y no puede retirarse el flag después. Las recetas de diseño eligen modo por vista y mantienen controles etiquetados.

Emoji documenta propiedad de aplicación, hasta 2.000 recursos y límite de 256 KiB por emoji; el plan no cuenta slots libres reales sin inventario autorizado. Channel documenta el endpoint de estado de voz y sus permisos. Polls, scheduled events y AutoMod documentan sus respectivos recursos; el plan los incorpora con dueño y disponibilidad explícitos.

El tutorial de interacciones describe respuesta inicial, modales y continuación. La referencia de comandos describe opciones, tipos de contexto y localización. Para límites exactos adicionales al implementar, consultar la fuente y la versión instalada; no tratar ejemplos web main como evidencia de versión productiva.

La revisión local corresponde al ZIP recuperado, edición 0.11, versión 10. Sus hashes y hallazgos quedan en evidencia-base.json. No se verificó HEAD remoto en esta unidad, se instalaron paquetes ni ejecutaron servicios externos. Las búsquedas por tokens de clases no son un inventario semántico exhaustivo de todos los comandos o listeners.
