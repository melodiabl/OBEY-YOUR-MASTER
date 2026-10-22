# Búsquedas, álbumes y radio desplegados · 22/10/2026

Código `07da107f020d40d825373af4cd5f35d231a838da`, imagen `078d7a2807c82dce298cc9f3afe44f4ea7874c3ac600222fcb3d0ae95cc5e667`, etiqueta `release-search-radio-20261022-07da107`. Incluye correcciones `9402f80` y parche de dependencia `07da107`.

[Problemas reproducidos y solución](../guia-arquitectura/BUSQUEDAS_ALBUMES_RADIO.md): los selectores continúan una búsqueda con una sola pista, los álbumes nativos se encolan como colecciones completas y radio/setup ya no intentan vaciar el mensaje al elegir o regresar. No cambian autorización, guardado o requisitos de voz. `follow-redirects` pasa de 1.16.0 a 1.16.1; solo ese paquete del lock cambia y no se añade dependencia directa. Auditoría: cero high/critical y 36 moderate heredadas.

19 grupos temporales de regresión/flujo, 25 originales, tipos y dependencias pasan. La imagen limpia también ejecutó los 25 originales sin red ni Gateway y coincidió en 31 hashes. [Evidencia local](evidence/search-radio-local-20261022.json).

[Evidencia operativa](evidence/search-radio-deployment-20261022.json): bot/imágenes/Redis saludables, cero reinicios, Gateway/heartbeat y Mongo conectados, 20 comandos globales, salud local/HTTPS pública 200. Trinium 02 sigue seleccionado y conectado, con Serenetia/MilloHost conectados; GDjkhp configurado sin conexión confirmada. Privado apagado, solo tres servicios con reinicio always.

Una consulta desde el contenedor desplegado devuelve 11 pistas y siete álbumes para adela; el primer álbum resuelve 11 canciones y contrato playlist. La estación 1 del catálogo devolvió HTTP 200 y 192.436 bytes PCM, 187.075 no nulos. Audio descartado en memoria. No se publicaron mensajes ni se inició voz de prueba: no equivale a un recorrido o escucha en Discord. Los flujos de activación, retirada, permisos y conflictos se probaron con transportes aislados.

Se recreó solo el bot conservando entorno, configuración interna, registro de nodos, montajes, recursos y healthcheck. Backup Mongo/configuración `/home/backups/obey-releases/2026-10-22T21-51-24-460Z`, Mongo de 59233751 bytes. Imagen anterior `localhost/obey-your-master_bot:release-log-visibility-20261020-0be39f3` y argumentos completos `.runtime/deploy-search-radio-20261022/rollback-arguments.json` conservados. Reversión preparada, no ejecutada; latest y ambos manifiestos privados actualizados después de comprobar salud.

Se retiraron verificadores, capturas de diagnóstico y contexto temporal. Los tres archivos originales de tests, respaldos y snapshots operativos se conservan. Sin push. Pendientes: recorrido real de !play y setup-radio, escucha en Discord, adaptador de letras/capacidades nativas, incidencia original de setup sin ubicación y demás bloques del maestro.
