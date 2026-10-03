# Salida de YouTube por Cloudflare WARP

OBEY usa la modalidad de proxy local gratuito de Cloudflare WARP. Solo Lavalink envía sus peticiones externas por el proxy SOCKS5 local `127.0.0.1:41081`; el bot conserva su red normal. No se usan cookies de YouTube.

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

La traza debe mostrar `warp=on`. Lavalink usa yt-dlp 2026.08.19 para buscar y extraer pistas; la imagen comprueba la suma SHA-256 al compilar. Las peticiones HTTP del reproductor pasan por proxychains. El cliente yt-dlp recibe el proxy como argumento y no necesita cookies. Si WARP se desconecta, ejecutar `warp-cli --accept-tos connect` y comprobar `warp-cli --accept-tos status`.

Una respuesta correcta de `/v4/loadtracks` confirma búsqueda y extracción. Para confirmar audio en Discord, reproducir una canción con `/play` en un canal de voz y comprobar que avanza el tiempo y se oye el audio.
