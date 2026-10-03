# Salida de YouTube por Cloudflare WARP

OBEY usa la modalidad de proxy local gratuito de Cloudflare WARP. Lavalink envía las peticiones HTTP de música al proxy local `127.0.0.1:41081`; la conexión de voz de Discord conserva su red normal. No se usan cookies de YouTube.

## Preparación del servidor

Instalar el cliente oficial de Cloudflare WARP para Linux siguiendo [la documentación de Cloudflare](https://developers.cloudflare.com/warp-client/get-started/linux/). Después, en el servidor:

```sh
warp-cli --accept-tos mode proxy
warp-cli --accept-tos proxy port 41081
warp-cli --accept-tos registration new
warp-cli --accept-tos connect
warp-cli --accept-tos status
```

El servicio `warp-svc` debe estar habilitado para arrancar con el sistema. No abrir el puerto 41081 a Internet: WARP solo escucha en loopback y Lavalink usa `network_mode: host`.

## Despliegue y comprobación

```sh
COMPOSE_PROFILES=managed-lavalink podman-compose -f docker-compose.yml -f docker-compose.override.yml up -d --build lavalink bot
curl --socks5-hostname 127.0.0.1:41081 https://www.cloudflare.com/cdn-cgi/trace
```

La traza debe mostrar `warp=on`. Lavalink usa yt-dlp 2026.08.19 para buscar y extraer pistas; la imagen comprueba la suma SHA-256 al compilar. El cliente yt-dlp recibe el proxy SOCKS5 como argumento y el reproductor HTTP de Lavalink usa el proxy HTTP. Si WARP se desconecta, ejecutar `warp-cli --accept-tos connect` y comprobar `warp-cli --accept-tos status`.

El plugin local `obey-ytdlp-warp-proxy` configura el proxy y el `User-Agent` de la fuente yt-dlp después de que PulseLink la registre. El `User-Agent` se comparte con los argumentos de extracción mediante un ancla YAML. Esto evita que la descarga use la IP directa del servidor o una identificación distinta y reciba 403. La imagen arranca Java directamente; no usar proxychains, que interfiere con las conexiones nativas de voz de Koe.

Java usa IPv4 para sus conexiones directas. La preferencia IPv6 anterior dejaba el arranque esperando la descarga del token público de Apple Music en este servidor. La salida de YouTube continúa por WARP, que gestiona la dirección externa del proxy.

## Reconstruir el plugin y verificar audio

El repositorio guarda el JAR y su código fuente, igual que los otros plugins locales. Para reconstruirlo hacen falta JDK 17 o posterior, `unzip` y Podman. El script compila con las dependencias del Lavalink desplegado:

```sh
./lavalink/proxy-plugin-src/build.sh
podman restart obey_lavalink
```

La prueba de integración usa la imagen de producción en un contenedor temporal. Extrae el vídeo, descarga el audio y decodifica 150 bloques (tres segundos); falla si recibe 403, no produce audio o no avanza la posición. No se conecta a Discord.

```sh
./lavalink/proxy-plugin-src/build.sh --probe fRIhCiUVaKs B402rKl4bUg
```

Una respuesta correcta de `/v4/loadtracks` solo confirma búsqueda y extracción. Para confirmar la salida audible en Discord, reproducir una canción con `/play` en un canal de voz y comprobar que avanza el tiempo y se oye el audio.
