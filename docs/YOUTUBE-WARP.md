# WARP retirado de la música

La configuración actual usa salida directa y un pool de conexiones musicales. El nodo interno escucha en `127.0.0.1`; el bot mantiene sus credenciales separadas de las conexiones públicas. Este documento sustituye la antigua preparación de WARP. No habilitar el proxy ni restaurar la imagen anterior de WARP.

El plugin `obey-ytdlp-direct` iguala el User-Agent del extractor y de la descarga HTTP sin configurar un proxy. Se reconstruye con las dependencias del Lavalink instalado:

```sh
./lavalink/direct-plugin-src/build.sh
```

La prueba de extracción, descarga y decodificación usa un contenedor temporal y no entra en Discord:

```sh
./lavalink/direct-plugin-src/build.sh --probe fRIhCiUVaKs B402rKl4bUg
```

El proveedor puede rechazar una salida directa. Una búsqueda correcta no confirma audio audible. El bot puede recuperar la pista por su URI en otra conexión disponible, conservando la sesión; los proveedores públicos tampoco garantizan disponibilidad permanente.

Consulta [Nodos de música](platform/MUSIC-NODES.md) para el registro, la selección, privacidad y comprobaciones de esta migración.
