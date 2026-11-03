# Migración musical a NyxLink

El usuario autoriza integrar su fork NyxLink en OBEY. Objetivo fijado: paquete publicado `nyxlink@0.1.0-dev.2`, Node22.23.4, Lavalink v4/NodeLink públicos; privado excluido. La cola, historial, avance de pistas, repetición, autoplay y recuperación pertenecen al reproductor nativo. La fachada OBEY conserva permisos, búsqueda/relevancia, favoritos, mensajes, traducciones y contrato HTTP/Socket.IO. No construir otra cola ni emular Shoukaku sobre el nuevo gestor.

## Unidades y aceptación

1. Inicialización y nodos: un Manager, conector Discord, nodos públicos y cierre nativo. Verificar conexión/backend y que no se inicializa Shoukaku.
2. Servicio musical: controles sobre Player/Queue nativos, proyecciones de lectura para consumidores existentes, ACK antes de éxito y cancelación por Stop. Pruebas de reproducción, pausa, cola, fin, modos y dos guilds con I/O controlado.
3. Consumidores y datos: voz, buscador, diagnósticos, salud, letras, panel y restauración del esquema existente. Favoritos/datos actuales conservados; snapshots son persistencia, no cola activa paralela.
4. Retirada y verificación: eliminar el motor reemplazado y dependencia Shoukaku tras migrar sus consumidores; mantener los tres archivos originales de tests adaptando sus fixtures al contrato nuevo. Tipos, dependencias, inventario, imagen y comprobaciones aisladas.
5. Aceptación de operación: nodos reales y escucha en guild autorizada, failover/reinicio, observación de latencias y reversión. Las pruebas sintéticas y el build no acreditan audición ni cierran todo P1.

La landing, materiales y alcance no musical se conservan. La autorización de integración no implica publicar una nueva versión de NyxLink.

## Implementación y verificación · 03/11/2026

Un único Manager NyxLink se inicializa con el conector Discord.js. Player/Queue gestionan cola, historial, autoplay, comandos y failover; las proyecciones OBEY conservan los consumidores Discord/HTTP/Socket.IO y la persistencia del esquema Mongo existente. Se eliminaron la dependencia y cinco archivos del motor Shoukaku sustituido. Los dos despachadores de comandos también usan el servicio musical; no desconectan audio por una caché de voz ausente.

Stop conserva cancelación independiente de Mongo, reintenta el snapshot detenido si el almacenamiento vuelve y no permite que una conexión fallida reactive lo anterior. Un nuevo intento libera esa cancelación únicamente tras conexión y persistencia de su sesión. La restauración evita sobrescrituras de 24/7, omite defaults actuales y repone filtros guardados sin sustituir las colecciones internas del SDK. Fallar el EQ predeterminado deja la voz disponible e indica estado sin confirmar.

Los tres archivos originales de tests se adaptaron al SDK real. La batería de migración añade verificaciones temporales de estado nativo, conservación de snapshots, cancelación, filtros y failover. Los arneses temporales se retiran tras conservar resultados, conforme a la limpieza solicitada. La evidencia distingue esos resultados de `npm test` permanente.

Se verificó conexión v4 y búsquedas reales en Serenetia/Millohost (20 resultados YouTube Music y 10 Spotify en la consulta observada), con nodo privado excluido. Ambos anuncian semver de compilación por hash: NyxLink los deja como backend desconocido; esta prueba no acredita capacidades exclusivas de NodeLink. Nazha/Trinium anuncian Lavalink4.2.2 y devolvieron YouTube Music, pero Spotify devolvió error. No se cambió la selección operativa por esas pruebas.

Se conservan landing, materiales, favoritos, colecciones y permisos. P0 mantiene su aceptación anterior; no se promueve ninguna capacidad por pasar esta batería. La audición real en Discord y la aceptación completa P1 siguen pendientes.

## Despliegue

Código `623ca80a`, imagen `release-nyx-20261103-623ca80a`, Node22.23.4 y UID1000. En la imagen pasan 61/61 casos (30 del proyecto, 13 de integración nativa y 18 de ciclo de vida). El inventario verifica 1.046 hashes, 661 comandos y 95 rutas; no se incluyen `.env` ni Shoukaku en la imagen. Tipos Welcome/Web, fronteras de dependencias y build Next pasan. La auditoría mantiene 50 avisos moderados del árbol existente, ninguno alto/crítico ni atribuido a NyxLink/consola.

Se recreó únicamente `obey_bot`. Salud observada HTTP200, Mongo y música disponibles, contenedor healthy y cero reinicios; sin errores fatales ni fallos de restauración registrados en la muestra. Millohost estaba disponible en esa observación; Serenetia había respondido en la prueba previa, pero no había emitido Ready en el arranque observado. No se presenta esto como failover real aceptado. El privado sigue excluido.

Reversión: imagen anterior `release-p0-session-20261031-2355287f` y configuración previa conservadas bajo `.runtime/nyx-migration-20261103/`. No hay migración destructiva de datos. [Evidencia de imagen y operación](evidence/nyx-migration-20261103.json), [resultado de las pruebas](evidence/nyx-migration-20261103.tap).
