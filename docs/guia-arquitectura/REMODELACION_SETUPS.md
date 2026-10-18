# Remodelación de setups antiguos

Petición del 18/10/2026: continuar el trabajo actual y después remodelar todos los setups del código anterior. Este mapa prepara esa continuación del mismo proyecto y de T08/T11/T12; no sustituye los planes existentes ni marca comandos como migrados.

## Base comprobada

[Inventario AST y hashes](../platform/evidence/setup-inventory.json), base `1157208`: 63 archivos de comandos, 62 de prefijo y uno slash, 40.107 líneas. Incluye `commands/Setup`, los dos setups de Owner, `commands/Music/setupmusic.js` y su adaptador slash. `handlers/music/setup.js` es el servicio interno de música y se registra como dependencia, no como otro comando ni como código que deba reemplazarse automáticamente.

La lectura estática detectó 1.450 llamadas a `eval`, seis altas globales `client.on('interactionCreate', ...)`, 211 creaciones/esperas de collectors de mensajes, 89 de componentes y 312 llamadas de mutación de stores con formas reconocidas. Son sitios de código, no llamadas simultáneas o una medición de fugas en producción; no representan todas las escrituras indirectas. Los comandos no se ejecutaron ni se cargaron para elaborar el inventario. Se extrajeron únicamente los metadatos del `module.exports` superior, sin confundirlos con nombres de embeds anidados.

Las seis altas globales están en setup, setup-language, setup-validcode, setup-antinuke y los dos setups de Owner. setup-language conserva además aliases copiados de anticaps. `setup-caps` y `cmdlog` ya tienen precedencias en el registro actual. `setup-music` y `setupmusic` son nombres canónicos de funciones diferentes: configuración musical legacy y canal de peticiones. No se fusionan por similitud del nombre. El inventario de conflictos calcula solo este subconjunto; el catálogo cargado completo y `handlers/command-registry.js` siguen siendo autoritativos.

## Alcance y orden

El usuario confirmó «Código y menús de Discord juntos». Cada entrega remodela el código y sus menús/mensajes, conservando capacidades, opciones, datos, aliases efectivos y audiencias. IDs de esta tabla son grupos de trabajo, no nuevos módulos/runtime.

| Orden | Grupo | Archivos | Dependencias y objetivo |
| --- | --- | --- | --- |
| 1 | SETUP-BASE · navegación y ajustes generales | 4 | Sesiones acotadas, registro de comandos, idioma y presentación |
| 2 | SETUP-WELCOME · bienvenida/despedidas | 4 | Reutilizar el piloto autorizado; conciliar campos avanzados uno a uno |
| 3 | SETUP-LOGS · registros | 6 | Validación canónica de canal y aliases de redirección |
| 4 | SETUP-SECURITY · moderación/protección | 18 | Permisos frescos, jerarquías y políticas del dominio antes de efectos |
| 5 | SETUP-MUSIC · música/voz | 6 | Servicios actuales de música/voz; distinguir configuración y canal de peticiones |
| 6 | SETUP-SUPPORT · tickets/solicitudes | 5 | Propietarios actuales de tickets y formularios; compatibilidad de instancias abiertas |
| 7 | SETUP-ROLES · roles/niveles/miembros | 4 | Políticas del recurso y mapping de datos antes de cambiar conceder/quitar roles |
| 8 | SETUP-AUTOMATION · comunidad/automatizaciones | 10 | Jobs existentes y sus políticas de cancelación/idempotencia |
| 9 | SETUP-FEEDS · plataformas | 4 | Integraciones y credenciales actuales, salud real del proveedor y deduplicación |
| 10 | SETUP-OWNER · dueño | 2 | Autorización exclusiva y audiencias privadas; no exponer por navegación pública |

Cada comando del JSON pertenece exactamente a un grupo y estaba pendiente en esa base. Los incrementos posteriores y sus casillas actuales figuran al final y en tasks/todo.md. Los grupos se subdividen en entregas de un comando o una operación, normalmente dos a cinco archivos; la tabla no autoriza una reescritura de miles de líneas en un solo commit. Un bloqueo específico de proveedor no impide avanzar en una operación independiente.

## Criterios para cada entrega

1. Identificar operaciones, valores permitidos, stores/campos, aliases efectivos, permisos, efectos Discord/jobs y variables de texto usados por ese comando. Registrar compatibilidad y casos que todavía dependan de proveedores reales.
2. Separar el adaptador Discord del servicio propietario y de la persistencia cuando corresponda. Reutilizar el escritor del dominio; no crear un segundo store ni un registro paralelo para los 63 comandos.
3. Sustituir listeners globales por sesiones del mensaje/interacción con dueño, expiración, cancelación y limpieza. Esperar el ACK, manejar errores asíncronos y revalidar permisos al actuar. No introducir otra sustitución temporal de `client.on`.
4. Retirar `eval` convirtiendo cada texto/resultado a traducciones y variables declaradas. Los catálogos legacy contienen expresiones y objetos: una sustitución masiva por interpolación simple no demuestra paridad. Verificar valores, escapes, formato y límites de Discord.
5. Comprobar lectura, guardado confirmado, input inválido, actor ajeno/revocado, canal/rol ajeno, cancelación, expiración, duplicación y fallo de persistencia/servicio que apliquen a la operación. Los flujos con efectos exigen comprobar qué se confirmó antes de reintentar.
6. Conservar la retirada de NSFW, el nodo privado apagado y los materiales actuales. Sin nuevo esquema, dependencia externa, registro global o despliegue como efecto implícito de refactorizar.

Aceptar un comando exige demostrar sus flujos incluidos, no solo reducir líneas o pasar sintaxis. Si una operación todavía sigue legacy debe quedar identificada; un grupo no se cierra por migrar su menú inicial.

## Primer recorrido previsto

`commands/Setup/setup.js` es el primer recorrido porque abre otros setups mediante `require` dinámico y añade un listener global sin cierre local. Migrarlo deberá usar el registro cargado/aliases efectivos, respetar la autorización del comando seleccionado y aislar dos sesiones concurrentes. La expiración o cancelación debe cerrar sus componentes; las excepciones asíncronas deben llegar a una respuesta controlada. Su primera entrega incluye catálogo vivo, menú por categorías/páginas y controles con expiración; los formularios de los comandos seleccionados se migran después por capacidad.

Después, setup-language y setup-embed validan que sesiones y textos pueden reutilizarse sin convertir sus reglas de negocio en un generador universal. setup-validcode y las otras cuatro altas globales tendrán entregas propias con sus permisos respectivos. El resto sigue el orden y las dependencias de la tabla.

## Verificación y reversión

Comandos del repositorio: `npm test`, `npm run typecheck:welcome`, `npm run dependencies:welcome`, `node --check <archivo>` y `git diff --check`. Tipos/imports actuales cubren el piloto de bienvenida, no certifican el código legacy de setups; ampliar su alcance solo al migrar una frontera concreta. No hay un `npm run build` general; el pipeline conserva su build de imagen separado.

Se mantiene la retirada de scripts/tests añadidos por el asistente: usar comprobaciones temporales proporcionadas, guardar evidencia y retirar fixtures. Para sesiones probar controles concurrentes/expirados y ausencia de listeners sobrantes; para stores usar Mongo aislado y comparar los campos avanzados; para UI renovada verificar payloads/componentes y los estados acordados. No usar servidores o credenciales de producción para estas pruebas.

Cada entrega conserva un commit de código reversible y evidencia ligada a SHA. La reversión no borra preferencias ni promete deshacer efectos Discord ya confirmados. El inventario y esta planificación son estáticos: no acreditan ejecución real, remodelación de los 63 setups ni corrección de las 1.450 llamadas a eval.


## Primera entrega local · navegación

Implementada en `eadc547b0684ded2c9cca65cc685362c518ab660`: `commands/Setup/setup.js` queda como adaptador de 13 líneas y delega en `handlers/setup-navigation.js`. Un solo mensaje ofrece categorías, selector de configuración, páginas de hasta 25 opciones y controles Anterior/Categorías/Siguiente/Cerrar, con es/en y sin eval. Lee el registro cargado y las reglas existentes de disponibilidad: excluye dueño, comandos restringidos/deshabilitados y el propio setup; distingue setup-music y setupmusic.

La entrada conserva Administrator y lo revalida junto con miembro, bot, canal, visibilidad y disponibilidad de DB/proceso. ACK antes de consultas; cola por sesión; permisos comprobados también después de una edición lenta. Seleccionar solo abre un comando canónico ofrecido y todavía disponible, con cooldown existente y referencia del registro revalidada. No hay require construido desde valores del menú. Los efectos de los asistentes elegidos siguen siendo responsabilidad de esos comandos y aún pueden conservar sus propias limitaciones legacy.

Cada mensaje usa el collector del SDK con máximo de 180 segundos e inactividad de 90. Cierre, expiración, selección y borrado liberan sus listeners; la limpieza se ordena después de las ediciones pendientes para que no reaparezcan controles. Son listeners temporales del SDK, sin otro listener global permanente añadido manualmente. El plazo por sesión es nuevo para este menú y no sustituye el cierre global pendiente del proceso.

[Evidencia JSON](../platform/evidence/setup-navigation.json): 15 escenarios con SDK real y transportes/miembros simulados, cero rechazos no manejados; 100 ciclos de abrir/expirar sin listeners restantes ni incremento persistente de su límite. Builders es/en, estados vacío/denegado/cerrado/error, opciones/páginas y límites Discord comprobados; sesiones concurrentes, doble clic, valores falsificados, permisos revocados antes y después de la edición, comando retirado, cooldown, fallo del handler, ACK vencido y cierre de proceso antes de actuar. Los 25 tests originales pasan; tipos/imports de bienvenida siguen pasando (no se atribuye tipado al controlador nuevo). Grafo: 1.021 módulos y 3.197 dependencias, cero infracciones activas.

La prueba no envió mensajes a Discord ni ejecutó los 62 asistentes restantes. El collector es real; providers, transportes y handlers de destino son fixtures. No acredita la apariencia en el cliente Discord, OAuth/Gateway, arranque completo o ciclo global. El script temporal se retiró después de terminar. El inventario inicial sigue ligado a su base y hashes históricos: esta entrega elimina cuatro eval y una de las seis altas globales manuales; no reescribe las demás.

El primer recorrido queda comprobado localmente; SETUP-BASE y los otros grupos siguen abiertos. La entrega posterior de [setup-language](IDIOMA_SETUP.md) ya remodela su menú y guardado; siguiente entrada: setup-embed. Sin publicación remota o despliegue; los datos, motor musical y configuración privada no se tocaron.

Fuentes primarias comprobadas: [Message 14.27.0](https://discord.js.org/docs/packages/discord.js/14.27.0/Message:Class) e [InteractionCollector 14.27.0](https://discord.js.org/docs/packages/discord.js/14.27.0/InteractionCollector:Class); la eliminación de listeners se contrastó también con el código instalado del SDK.

## Segunda entrega local · idioma

[Idioma: comportamiento, datos y evidencia](IDIOMA_SETUP.md), commit `f4163778677b3b893bde2308c1a328e8d24111e5`. Un mensaje con estado actual, selección pendiente, Guardar/Usar inglés/Cerrar; es/en, cuatro idiomas realmente cargados, permisos por acción y persistencia confirmada/CAS del mismo campo legacy. Pasan 21 escenarios Mongo/SDK, 100 ciclos y los 25 originales. Dos de 63 archivos de comandos remodelados localmente; quedan 61. Siguiente setup-embed. Sin despliegue.
