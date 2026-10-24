# P0 · conciliación de base y registro efectivo

Esta entrega sigue el [orden activo](../../tasks/plan.md#orden-activo--23102026). Cierra el inventario de implementaciones de entrada y las discrepancias concretas descritas aquí; no acredita el funcionamiento de todas las capacidades ni cierra automáticamente G01/G02.

## Registro observado

Los cargadores reales, ejecutados sin login en un contenedor sin red, producen 531 comandos prefix, 144 handlers slash en veinte entradas principales y 779 aliases. Las 675 operaciones tienen un archivo de implementación localizado por identidad del export cargado. La composición real de Express registra 95 rutas en once adaptadores; no se ejecutó ninguna solicitud ni handler de negocio. Se sustituyeron exclusivamente el scheduler de sorteos, el store de sesión y la apertura del servidor/timers necesarios para observar el registro sin activar servicios.

El [inventario vigente](operation-ownership.json) conserva propietarios actuales, llamadas directas al cliente observadas en el AST, metadatos de permisos, excepciones legacy y hashes de 963 fuentes. Un propietario es el archivo que orquesta hoy la entrada. No es una afirmación de que exista un servicio canónico para cada intención. Las entradas con negocio inline siguen identificadas como adaptadores actuales; su extracción y aceptación conservan las tareas originales. Los imports/calls son evidencia estática, no prueba de que se recorran todas sus ramas.

## Discrepancias corregidas

- Los 26 aliases con colisiones tienen una política explícita. Se conservan los 779 destinos efectivos, con precedencia de nombres reales sobre aliases; no se cambian permisos ni comandos de destino.
- Se declaran seis dependencias importadas directamente con las mismas versiones e integridades que ya estaban en el lock: builders/rest de Discord, form-data, node-fetch, request y ws. No se actualiza el grafo instalado. `request` sigue siendo legacy y conserva su deuda; no se reemplazan setenta consumidores durante una conciliación de base.
- El handler opcional de Epic importa `fortnite`, pero no se carga al arrancar. Queda como excepción localizada y no activada; sus comandos/flujo no se dan por funcionales.
- Los manifests de música, bienvenida, ayuda y Architect describen 34, nueve, tres y 21 rutas existentes, respectivamente, incluidas las páginas y API de biblioteca/editor, ayuda y Architect. Todas tienen una ruta registrada equivalente; no se crean endpoints por ampliar el manifest.
- El documento de runtime conservaba una etiqueta/kind de la entrega musical anterior pese a tener código e imagen nuevos. La referencia queda conciliada con el código, la etiqueta y la evidencia de esta entrega.

## Instalación y CI

El CI existente verifica hashes, cobertura de archivos de comandos, export `run`, aliases/colisiones, rutas de manifests y declaraciones de dependencias dentro de la imagen construida. Un cambio de fuentes requiere actualizar el inventario afectado; una colisión nueva exige una decisión explícita. El gate comprueba coherencia, no ejecuta comandos ni sustituye las pruebas de permisos/efectos.

El [contrato de instalación musical](music-client-installation.json) contiene package y lock de un paquete aislado usado por CI para preparar P1. Una instalación limpia de lavalink-client 2.11.0 resuelve ws 8.22.0, satisface su requisito ^8.21.3 y carga el export CommonJS con Node 22. No usa el ws 8.21.0 del proyecto para simular compatibilidad. No se instala lavalink-client en producción ni se crea otro player/cola. El lock de este entorno aislado no reemplaza los locks del bot o del frontend.

`autoSkip:false` sigue permitiendo que el cliente avance su cola interna. P1 debe transferir la autoridad y snapshots; una biblioteca importada no acredita esa migración. La instalación definitiva se conectará al consumidor real y se conciliará con el lock principal en ese corte.

## Despliegue verificado · 24/10/2026

Código `1f4a7ae`, imagen `becbefb`, diez muestras saludables y cero reinicios. Los 25 tests originales y gates del CI ejecutados localmente sobre la imagen final pasan; no hay ejecución remota del CI. Se verifican 1.002 fuentes y 24 archivos compilados en imagen/runtime, respuestas HTTP locales/públicas y hashes JS/CSS públicos. El arranque no muestra patrones de error fatal. Respaldo completo con CRC, imagen/argumentos de reversión `b31c65b` y configuración operativa preservados. La etiqueta y evidencia del runtime ya coinciden con esta versión.

Se retiran seis verificadores/operadores temporales y dos paquetes aislados, conservando evidencia privada, los tres archivos originales de tests y sus 25 casos. El cliente musical nuevo sigue fuera de producción; no se dan por aceptadas reproducción ni acciones autenticadas por estos controles.

## Aceptación pendiente de P0

Revisar el vínculo de intenciones compartidas prefix/slash/web con sus políticas, servicios y stores legacy, y registrar las diferencias deliberadas o su tarea de migración. Esta revisión conserva G01/G02 parciales; no saltar al rediseño del reproductor ni marcar todas las operaciones como aceptadas por cargar sus exports. Después se aborda P1 conforme a su matriz musical.

[Resultados y evidencia de la entrega](evidence/p0-reconciliation-20261023.json). Los verificadores temporales se retiran al terminar; se conservan los tres archivos originales de tests. No hay push ni ejecución de comandos/eventos/voz de prueba.

## Intenciones compartidas · revisión del 24/10/2026

El [mapa revisado](shared-intents.json) traza nueve grupos: idioma, prefijo, corazones, playlists, bienvenida, logs, ayuda, advertencias y pagos. Son 25 entradas y 19 rutas; no se extrapola esa revisión a las 650 entradas y 76 rutas restantes. Se distinguen propietario compartido observado, divergencia registrada y comportamiento corregido en aislamiento. Referencias e IDs se validan en el CI existente.

Se corrige idioma: setup, `/config idioma` y formulario web delegan en `createLanguageSettings`. Se elimina el write directo de slash/web, se espera la persistencia condicional y se rechaza una revisión antigua. Slash comprueba acceso fresco antes de guardar y ofrece el catálogo soportado es/en/de/in. El panel conserva el idioma actual y guarda esa preferencia mediante su propio botón/formulario, sin modificar otros ajustes; conserva CSRF y devuelve conflicto si cambió desde otro panel. Las restricciones actuales de acceso de cada interfaz se mantienen explícitas en el mapa.

La revisión también localiza historias de advertencias incompatibles entre prefix y slash (T35), mutaciones de playlists separadas (T19/T20), validación/confirmación de prefijo divergente (T12) y transferencias económicas sin una autoridad atómica compartida (T46). Se conservan datos y tareas de migración; no se intenta resolverlas sustituyendo masivamente el negocio legacy durante el inventario.

Catorce casos aislados, 25 originales, tipos y fronteras pasan. El formulario EJS completo se recorrió en Chromium con estado sintético: catálogo, selección, formularios separados, CSRF, guardado confirmado y rechazo de una segunda pestaña antigua; control visible en móvil. [Evidencia y límites](evidence/p0-shared-intents-20261024.json). G01/G02 y el recorrido autenticado real continúan abiertos.

Desplegado `f92bc40`, imagen `27c1b75`: diez muestras saludables, cero reinicios y ningún patrón fatal en el arranque; 1.003 archivos de fuente/contrato y 24 de export coinciden con imagen/runtime. HTTP local/público y assets JS/CSS pasan. Respaldo CRC y reversión `1f4a7ae` conservados; verificadores, perfil y servidor sintéticos retirados. Siguiente revisión P0: prefijo y las entradas aún no trazadas, manteniendo G01/G02 abiertos.

## Prefijo de guild · continuación del 24/10/2026

Las entradas `prefix`, `/config prefix` y el formulario web delegan ahora en `createPrefixSettings`, que reutiliza el CAS y la cola de `setup-settings`. La validación compartida admite entre una y cinco unidades UTF-16, como el límite legacy, y rechaza espacios, controles y caracteres de formato invisibles. Web deja de truncar. El éxito espera la persistencia; una revisión antigua produce conflicto y un valor sin cambios no escribe. Discord comparte orquestación, revalida acceso y no publica menciones al mostrar el prefijo.

El formulario web guarda el prefijo por separado y conserva idioma y otros ajustes. Una página antigua que envíe el prefijo junto al formulario general recibe conflicto sin mutar esos ajustes. Los accesos existentes de cada superficie se conservan. El prefijo global del owner y el reinicio completo de ajustes son intenciones distintas, localizadas sin ejecutarlas ni declararlas migradas; sus riesgos legacy quedan registrados en el mapa.

Veinte casos de adaptadores pasan tras corregir dieciséis fallos de contrato en el baseline; tres casos adicionales verifican exclusión de guardados concurrentes, flush y no-op. Las 25 pruebas originales, tipos y fronteras pasan. Formulario EJS completo en Chromium: teclado, móvil, CSRF, aislamiento de campos, segunda pestaña y cero errores JavaScript sin capturar. [Evidencia](evidence/p0-prefix-20261024.json). La revisión cubre ahora once grupos/27 entradas/19 rutas; quedan 648 entradas y 76 rutas por revisar. P0 permanece activo.

Desplegado `973ff24`, imagen `78c24d2`, con diez muestras saludables y cero reinicios automáticos. Los 1.005 archivos de fuente/contrato y 24 de export coinciden con runtime; HTTP local/público y assets JS/CSS pasan. Respaldo CRC, configuración y reversión `f92bc40` conservados; seis verificadores/operadores temporales, navegador/perfil y servidor sintéticos retirados. Siguiente unidad P0: navegación central de setup y opciones Config restantes; no cerrar G01/G02 por este incremento.

## Navegación setup y opciones Config · continuación del 24/10/2026

Setup comparte ahora la normalización de categoría/página entre render, selección y regreso. Una página inicial fuera de rango acepta el comando que muestra; una categoría inicial inexistente vuelve a una vista válida. Se comprueban tipo de componente y selección única, además de actor, guild, mensaje, permisos frescos y cooldown ya existentes. Slash sigue privado y el asistente/regreso reutiliza el mensaje.

`/config adminrol` y `/config autorole` comparten `configureRoles`, las definiciones existentes de setup, `checkResources` y el CAS de `setup-settings`. Consultan estado persistido y esperan el guardado antes de confirmar; no mutan arrays de caché previamente. Nuevos autoroles se resuelven por API fresca y se rechazan si son de otra guild, iguales/superiores al bot, administrados, everyone o Administrator, o falta ManageRoles al bot. Retirar/limpiar permite corregir configuraciones legacy sin exigir una concesión nueva. La política permissionOnly de roles admin OBEY se conserva; no equivale a asignar roles Discord.

Se trazan también setupmusic, Architect, resumen Config, categoría MUSIC y 24/7. Resumen usa una proyección de caché independiente y un fallback de prefijo distinto del global; MUSIC tiene escritura directa; 24/7 oculta fallos de conexión/almacenamiento. Sus diferencias y tareas permanecen explícitas, sin cambiar el motor musical durante P0. El mapa suma diecinueve grupos, 41 entradas y 21 rutas; faltan 634 entradas y 74 rutas.

Treinta y tres casos aislados pasan frente a diecinueve incumplimientos de contrato en el baseline; 25 originales, tipos y fronteras pasan. Los incumplimientos incluyen contratos nuevos y no representan diecinueve incidentes de producción. No se enviaron mensajes ni se asignaron roles, crearon canales o ejecutaron trabajos Architect reales. [Evidencia](evidence/p0-setup-config-20261024.json). La aceptación Discord real y G01/G02 siguen abiertas.

### Conciliación de seguridad antes del despliegue

La auditoría actual detectó tres paquetes con severidad alta (41 avisos totales) frente al resultado anterior sin altos. Se revisaron los avisos y parches oficiales y se actualizaron seis ubicaciones existentes del lock: body-parser 1.20.9, Undici 6.29.1 en REST/Discord y 7.30.1 directo, Zod 4.6.7 y serialize-javascript 7.1.3. No se añaden paquetes ni se cambian versiones mayores. La auditoría posterior vuelve a 36 moderate, cero low/high/critical; frontend conserva cero avisos.

También se detectó Undici 6.28.0 integrado en Node 22.23.2. El caso aislado de respuesta HTTP malformada provocaba una excepción sin manejar en ese runtime. Docker y CI se fijan en Node 22.23.4, que incluye Undici 6.29.1; el mínimo del proyecto se actualiza. Se mantiene el cliente musical actual, sin sustituir APIs globales ni añadir otra cola. Los casos de seguridad y todo el comportamiento de setup se vuelven a ejecutar en la imagen final. El JSON Schema de bienvenida sigue idéntico.

Fuentes oficiales: [body-parser](https://github.com/expressjs/body-parser/releases/tag/1.20.9), [Undici](https://github.com/nodejs/undici/security/advisories/GHSA-xjj6-f33q-929c), [Zod](https://github.com/colinhacks/zod/commit/a0ebf970f2d752e5f58527cd2942ff48be4f46bd), [serialización](https://github.com/advisories/GHSA-m5mm-p8h7-m29v) y [Node](https://github.com/nodejs/node/releases/tag/v22.23.4). El detalle de alcance y límites está en la evidencia de esta unidad; no se declara resuelta la deuda moderate legacy.

Desplegado `8e7b9ea`, imagen `41c57b9`: Node 22.23.4/Undici integrado 6.29.1, diez muestras saludables y cero reinicios automáticos. 33 casos funcionales, diez de seguridad y 25 originales pasan en la imagen; 1.007 archivos de fuente/contrato y 24 de export coinciden con runtime. HTTP/assets locales/públicos y Gateway/veinte slash comprobados. Respaldo CRC y reversión `973ff24` conservados; temporales y candidatos propios sin uso retirados. P0 continúa con resumen Config y categoría MUSIC; no se cierra G01/G02 por esta entrega.
