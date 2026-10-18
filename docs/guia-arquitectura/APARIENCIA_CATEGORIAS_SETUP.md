# Apariencia y categorías · setups remodelados

Entrega local del 18/10/2026, continuación de los 63 setups pedidos. Código y menús juntos; sin despliegue.

`setup-embed` usa un mensaje con vista previa, formulario de color/texto/icono, miniatura, Guardar, Descartar y Cerrar. Elegir o editar no escribe. Color admite negro/cero, hexadecimal y nombres del SDK; se retira el uso roto de `Util.resolveColor`. URLs rechazan credenciales y esquemas ajenos a HTTP(S); el bot no descarga imágenes durante la validación. El footer reutiliza la política de presentación existente, que todavía puede aplicar sus fallbacks.

`setup-commands` muestra las doce categorías existentes y una selección explícita de cuáles quedan activadas. Una selección repetida no invierte valores. Guardar aplica cambios; Descartar revierte solo la selección local. Setup/Settings quedan fuera de esas doce banderas para conservar una vía de reactivación. No hay opciones NSFW.

La política `commandCategoryEnabled` se comparte entre prefijo, slash, autocompletado y ayuda. Reconoce nombres legacy Anime-Emotions, School-Commands y Custom-Queue. Una bandera explícitamente falsa bloquea nuevas invocaciones de su categoría; ausencia conserva el comportamiento permitido por defecto. No detiene players, jobs o controles de sesiones existentes: esas políticas por dominio se mantienen separadas.

`setup-settings` recibe paths/validadores declarados por código, nunca paths del usuario. Usa la cola SyncMap, confirmación Mongo y CAS sobre los roots implicados; solo actualiza campos editados y conserva los demás. Una caché escrita después por legacy no se reemplaza con una respuesta anterior. Lectura sin documento no crea un registro fantasma en la caché. No hay nuevas colecciones ni migración de datos.

`setup-session` posee el collector del mensaje y sus formularios temporales. Está ligado a actor/guild/mensaje, confirma controles antes de consultar proveedores y revalida acceso al actuar. Un formulario se abre como respuesta inicial con los valores locales ya autorizados; su envío vuelve a autorizar y rechaza una versión local obsoleta. Cerrar/caducar el padre elimina también collectors de formularios. Las ediciones de limpieza siguen a las pendientes para que los controles no reaparezcan. Plazos: 180 s máximo, 90 s de inactividad y 90 s por formulario.

Verificación temporal: 17 grupos con Mongo/SyncMap y collectors/builders reales del SDK, incluyendo CAS entre stores, defaults, negro, límites, guardado, formulario inválido/obsoleto, revocación, cierre padre/formulario, categorías repetidas/vacías, conflictos, expiración y flush de escritura aceptada. 100 ciclos de formulario abierto/cerrado dejan cero listeners y restauran su límite. Otros 16 grupos ejecutaron los handlers reales de prefijo/slash con dependencias y transporte aislados para contrastar las doce categorías, su reactivación, autocompletado y ayuda. Cero rechazos no manejados. Los originales 25/25, tipos/imports de bienvenida, sintaxis y diff pasan; el grafo contiene 1.029 módulos y 3.218 dependencias sin infracciones activas.

Los dos programas de comprobación son temporales fuera del repositorio; las bases se crean vacías y se eliminan al terminar. No se han restaurado tests/scripts permanentes. La apariencia en el cliente Discord, Gateway/OAuth, arranque completo e imagen no se deducen de estos fixtures. Nuevos componentes con copy es/en; los demás setups siguen su migración por capacidad.

Revertir la entrega revierte código y menús, sin borrar preferencias. Mantiene los mismos campos legacy; el rollback no revierte las elecciones guardadas por un administrador.
