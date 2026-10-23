# P0 · conciliación de base y registro efectivo

Esta entrega sigue el [orden activo](../../tasks/plan.md#orden-activo--23102026). Cierra el inventario de implementaciones de entrada y las discrepancias concretas descritas aquí; no acredita el funcionamiento de todas las capacidades ni cierra automáticamente G01/G02.

## Registro observado

Los cargadores reales, ejecutados sin login en un contenedor sin red, producen 531 comandos prefix, 144 handlers slash en veinte entradas principales y 779 aliases. Las 675 operaciones tienen un archivo de implementación localizado por identidad del export cargado. La composición real de Express registra 95 rutas en once adaptadores; no se ejecutó ninguna solicitud ni handler de negocio. Se sustituyeron exclusivamente el scheduler de sorteos, el store de sesión y la apertura del servidor/timers necesarios para observar el registro sin activar servicios.

El [inventario vigente](operation-ownership.json) conserva propietarios actuales, llamadas directas al cliente observadas en el AST, metadatos de permisos, excepciones legacy y hashes de 963 fuentes. Un propietario es el archivo que orquesta hoy la entrada. No es una afirmación de que exista un servicio canónico para cada intención. Las entradas con negocio inline siguen identificadas como adaptadores actuales; su extracción y aceptación conservan las tareas originales. Los imports/calls son evidencia estática, no prueba de que se recorran todas sus ramas.

## Discrepancias corregidas

- Los 26 aliases con colisiones tienen una política explícita. Se conservan los 779 destinos efectivos, con precedencia de nombres reales sobre aliases; no se cambian permisos ni comandos de destino.
- Se declaran seis dependencias importadas directamente con las mismas versiones e integridades que ya estaban en el lock: builders/rest de Discord, form-data, node-fetch, request y ws. No se actualiza el grafo instalado. `request` sigue siendo legacy y conserva su deuda; no se reemplazan setenta consumidores durante una conciliación de base.
- El handler opcional de Epic importa `fortnite`, pero no se carga al arrancar. Queda como excepción localizada y no activada; sus comandos/flujo no se dan por funcionales.
- Los manifests de música y bienvenida describen 34 y nueve rutas existentes, respectivamente, incluidos biblioteca/editor y compatibilidad. Todas tienen una ruta registrada equivalente; no se crean endpoints por ampliar el manifest.
- El documento de runtime conservaba una etiqueta/kind de la entrega musical anterior pese a tener código e imagen nuevos. La referencia se concilia con la imagen y evidencia operativas al cerrar la entrega.

## Instalación y CI

El CI existente verifica hashes, cobertura de archivos de comandos, export `run`, aliases/colisiones, rutas de manifests y declaraciones de dependencias dentro de la imagen construida. Un cambio de fuentes requiere actualizar el inventario afectado; una colisión nueva exige una decisión explícita. El gate comprueba coherencia, no ejecuta comandos ni sustituye las pruebas de permisos/efectos.

El [contrato de instalación musical](music-client-installation.json) contiene package y lock de un paquete aislado usado por CI para preparar P1. Una instalación limpia de lavalink-client 2.11.0 resuelve ws 8.22.0, satisface su requisito ^8.21.3 y carga el export CommonJS con Node 22. No usa el ws 8.21.0 del proyecto para simular compatibilidad. No se instala lavalink-client en producción ni se crea otro player/cola. El lock de este entorno aislado no reemplaza los locks del bot o del frontend.

`autoSkip:false` sigue permitiendo que el cliente avance su cola interna. P1 debe transferir la autoridad y snapshots; una biblioteca importada no acredita esa migración. La instalación definitiva se conectará al consumidor real y se conciliará con el lock principal en ese corte.

## Aceptación pendiente de P0

Revisar el vínculo de intenciones compartidas prefix/slash/web con sus políticas, servicios y stores legacy, y registrar las diferencias deliberadas o su tarea de migración. Esta revisión conserva G01/G02 parciales; no saltar al rediseño del reproductor ni marcar todas las operaciones como aceptadas por cargar sus exports. Después se aborda P1 conforme a su matriz musical.

[Resultados y evidencia de la entrega](evidence/p0-reconciliation-20261023.json). Los verificadores temporales se retiran al terminar; se conservan los tres archivos originales de tests. No hay push ni ejecución de comandos/eventos/voz de prueba.
