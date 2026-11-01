# Instalar una instancia de OBEY

Revisado el 01/11/2026 contra el checkout de implementación. Usa una aplicación Discord y datos propios para la primera instalación. El entorno `.runtime` del servidor y sus credenciales no se distribuyen en Git. Esta guía no publica los cambios locales pendientes en el remoto ni certifica un arranque nuevo con proveedores de un tercero.

## 1. Código y dependencias

Obtén un checkout o paquete identificado por commit. Para la rama de implementación publicada:

```sh
git clone --branch feature/obey-main-implementation https://github.com/melodiabl/OBEY-YOUR-MASTER.git
cd OBEY-YOUR-MASTER
git rev-parse HEAD
node --version
```

Compara el commit con la entrega recibida: el remoto puede estar por detrás del trabajo local. No actualices un despliegue con `git pull origin master` sin conciliar su rama y sus datos.

Utiliza **Node.js 22.23.4**, fijado en Docker y CI. En Debian/Ubuntu, la instalación nativa necesita `build-essential`, `pkg-config`, `libcairo2-dev`, `libpango1.0-dev`, `libjpeg-dev`, `libgif-dev`, `librsvg2-dev` y `python3`, según el Dockerfile. El frontend tiene su propio lockfile:

```sh
npm ci
npm ci --prefix dashboard/frontend --ignore-scripts
npm run web:build
cp -n example.env .env
chmod 600 .env
```

La copia conserva un `.env` existente. `example.env` mantiene claves heredadas y no es una configuración completa. No existe `.env.example`. Edita `.env` con las claves vigentes del apartado siguiente. Ejecuta desde la raíz; varias rutas del código dependen del directorio actual.

## 2. Configuración mínima

| Variable | Uso |
| --- | --- |
| `BOT_TOKEN` | Token de tu aplicación Discord. La clave antigua `token` tiene precedencia si contiene un valor; déjala vacía al usar `BOT_TOKEN`. |
| `MONGO_URL` | URI de tu base MongoDB, usada también por las sesiones del panel. Usa un usuario limitado a esa base. |
| `DISCORD_CLIENT_ID` | ID de la misma aplicación Discord. |
| `DISCORD_CLIENT_SECRET` | Secreto OAuth de esa aplicación; no se entrega al navegador. |
| `SESSION_SECRET` | Valor aleatorio privado para firmar cookies. Por ejemplo, genera 48 bytes con `openssl rand -hex 48` y guárdalos en `.env`. |
| `DASHBOARD_BASE_URL` | Origen externo exacto, sin barra final. En local: `http://localhost:3002`. En producción: tu origen HTTPS. |
| `DASHBOARD_PORT` | Puerto de escucha; usa `3002` para coincidir con la comprobación de salud del Compose incluido. |
| `LAVALINK_PRIVATE_ENABLED` | `false` para usar solo el registro público descrito abajo. |
| `LAVALINK_NODES_FILE` | Ruta al registro de nodos: `.runtime/nodes/nodes.json` al ejecutar desde la raíz. |
| `LAVALINK_DEFAULT_NODE` | `auto`, o un ID habilitado del registro. Configúralo explícitamente: el Compose conserva un valor heredado como fallback. |

El código solicita los intents privilegiados Members, Presences y Message Content. Habilita los que tu aplicación tenga autorizados en el Developer Portal antes de arrancar; su revisión y disponibilidad dependen de Discord. Invita con `bot` y `applications.commands`, otorgando los permisos de las funciones utilizadas. `/setup` exige Administrador al actor; el bot necesita sus permisos de canales, roles o voz correspondientes. No uses Administrador del bot como solución general a cualquier error.

En OAuth registra exactamente `DASHBOARD_BASE_URL` + `/auth/callback`, por ejemplo `http://localhost:3002/auth/callback`. En producción sirve HTTPS y limita el acceso directo al backend mediante el proxy del despliegue: Express confía en un salto de proxy. Si faltan `DISCORD_CLIENT_SECRET` o `SESSION_SECRET`, la web se desactiva; la comprobación HTTP del Compose incluido no podrá pasar.

## 3. Nodos de música

El registro no va en el frontend. Crea `.runtime/nodes/nodes.json` con versión 1 y nodos v4 que hayas comprobado desde tu servidor. Este ejemplo usa datos deliberadamente ficticios; reemplázalos antes de iniciar:

```json
{
  "version": 1,
  "nodes": [
    {
      "id": "public-primary",
      "label": "Principal público",
      "visibility": "public",
      "host": "node.example.invalid",
      "port": 443,
      "password": "REEMPLAZAR_PASSWORD_DEL_PROVEEDOR",
      "secure": true,
      "priority": 10,
      "enabled": true
    }
  ]
}
```

El campo `host` no lleva `wss://` ni ruta; `secure:true` selecciona TLS. Todos los nodos públicos deben usar TLS. Agrega respaldos con IDs distintos y prioridades propias. El selector considera disponibilidad y capacidades; no copia automáticamente un listado de Internet ni garantiza todas las fuentes/plugins por conectarse. Un nodo conectado no demuestra reproducción continua. La matriz completa de audio, recuperación y controles sigue en P1.

Para Spotify/Apple Music, revisa `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_MARKET`, `APPLE_MEDIA_TOKEN` y `APPLE_MUSIC_COUNTRY` según los proveedores que vayas a usar. Los catálogos y la resolución de audio dependen también del nodo y sus plugins. El código permite Spotify, YouTube, YouTube Music y Apple Music; HTTP se utiliza para radio. No habilites de nuevo las fuentes retiradas desde una configuración histórica.

El nodo privado permanece opcional: `LAVALINK_PRIVATE_ENABLED=true` usa `LAVALINK_HOST`, `LAVALINK_PORT`, `LAVALINK_PASSWORD` y `LAVALINK_SECURE`. En Compose, el servicio local requiere el perfil **`manual-lavalink`** y el bot fuerza el privado a `false`: levantar ese servicio por sí solo no lo conecta al bot. Cambiar ese despliegue exige una configuración explícita. El flujo público anterior no levanta el nodo privado ni WARP.

## 4. Dueños y configuración persistente

Antes de iniciar una instancia nueva, ajusta `ownerIDS` en `botconfig/config.json` a tus IDs completos de Discord y revisa su prefijo/estado. `ownerIDS` es la autoridad; la clave antigua `ownerid` no sustituye la lista. No pongas tokens en archivos versionados.

Prepara los tres documentos globales a partir de esa configuración:

```sh
node scripts/initialize-global-configuration.js
```

El inicializador valida y crea `.runtime/global-configuration/{config,advertisement,status}.json`; preserva una configuración completa existente. Al ejecutar directamente, define `OBEY_GLOBAL_CONFIG_DIR` en `.env` con la **ruta absoluta real** de ese directorio. No uses una variable sin expandir ni una ruta relativa. Compose la establece como `/app/runtime-configuration` y monta el directorio en escritura.

En una actualización, conserva los documentos del despliegue previo. Una migración desde una imagen antigua usa `--from-container NOMBRE` con el contenedor fuente detenido; no inicialices desde defaults del repositorio encima de una configuración real. Consulta [la entrega de configuración global](../platform/P0-GLOBAL-CONFIG-2026-10-29.md).

El mapa de emojis es otro archivo operativo: `OBEY_EMOJI_MAP_FILE` permite indicar su ruta; Compose monta `.runtime/emojis/application-emojis.json`. Los recursos locales no implican emojis publicados. `node scripts/obey-assets.js` solo valida; `--apply` publica y necesita credenciales de la aplicación. No es un paso automático de instalación.

## 5. Arranque y comprobación

Para ejecución directa, después de configurar los puntos anteriores:

```sh
npm start
```

Usa un supervisor para mantener la instancia; no ejecutes dos copias con la misma aplicación y datos. Las funciones de imágenes requieren el servicio de `image-service/` en `http://127.0.0.1:3203` o `IMAGE_SERVICE_URL`. El arranque directo del bot no lo inicia. Redis/BullMQ es opcional y se configura por separado mediante `OBEY_JOBS_ENABLED` y `OBEY_JOBS_REDIS_URL`; no copies `.env.jobs` de otro despliegue.

Para el Compose incluido, crea los directorios `.runtime/nodes`, `.runtime/emojis` y los documentos globales del apartado 4; establece `LAVALINK_DEFAULT_NODE=auto` en `.env`. Los montajes del bot tienen que ser legibles por UID 1000 y el global debe ser escribible. Ajusta propiedad según el mapeo del runtime; no uses permisos 777. Los secretos permanecen fuera de Git y de la imagen.

```sh
docker compose -f docker-compose.yml build images bot
docker compose -f docker-compose.yml up -d images bot
docker compose -f docker-compose.yml ps
curl --fail http://127.0.0.1:3002/health
```

Este Compose usa red del host y se dirige a Linux; no levanta MongoDB. El bot usa los montajes de nodos/emojis en lectura y configuración global en escritura. Docker compila Next automáticamente. En un despliegue existente usa su receta de release y sus archivos privados, no sustituyas su entorno por el ejemplo público.

El inicio real sincroniza el registro slash global. Si cambia el catálogo, puede modificar los comandos de la aplicación; usa una aplicación de desarrollo para un primer arranque. La publicación manual del dueño mediante `deployslash` muestra una vista previa y requiere confirmación; no es una comprobación inocua.

`/health` indica salud básica; no acredita audio, permisos de cada canal o guardado de todos los sistemas. Abre `/app/` para el panel y `/setup` para configurar Discord. Un error 503 al consultar servidores significa que no se pudo verificar el acceso actual; no se reutiliza una lista vieja como autorización.

## Actualización y reversión

Identifica commit e imagen, detén escrituras y conserva un respaldo verificado de MongoDB y los directorios montados antes de actualizar. Mantén la imagen y receta anterior, con sus secretos en privado; comprueba salud y recursos tras iniciar. No restaures una base real para probar la guía. Volver a una imagen anterior también devuelve su comportamiento y sus límites de seguridad. La recuperación completa y el escalado siguen en P5; los informes de cada release delimitan lo comprobado.
