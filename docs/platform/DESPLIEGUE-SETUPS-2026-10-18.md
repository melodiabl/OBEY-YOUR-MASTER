# Despliegue de setups y recuperación de OBEY

El 18/10/2026 se desplegó `f4acfac5226022d68e458ef09cc24e216df69292` en `obey_bot`, imagen `localhost/obey-your-master_bot:release-setups-20261018-f4acfac`. Los 63 archivos del inventario de setups coinciden por SHA-256 entre el checkout y el contenedor. [Evidencia](evidence/setup-deployment-20261018.json).

El Gateway quedó conectado y confirmó heartbeats. MongoDB terminó de inicializar, se registraron 19 comandos slash globales y los tres servicios —bot, imágenes y Redis— quedaron `healthy`, sin reinicios. `/health` devuelve HTTP 200 con `database=true` y `music=true`, tanto localmente como por HTTPS público. La portada pública también devuelve 200 usando un agente de navegador; Cloudflare bloquea el agente predeterminado de Python con 403/1010.

Se conservó la configuración efectiva anterior: GDjkhp como nodo público preferido y Serenetia/MilloHost como respaldos; los tres conectaron. Lavalink privado continúa deshabilitado, con su contenedor sin iniciar y política `no`. No se inició ningún servicio ajeno a OBEY.

La versión instalada de Podman no permite cambiar `restart` con `podman update`; se recrearon los tres contenedores con política `always`, manteniendo las imágenes de Redis/imágenes, el volumen `obey_redis_data`, los bind mounts, el entorno y los límites anteriores. El bot usa la imagen nueva y tiene 30 segundos para cerrar. Los contenedores anteriores se conservaron detenidos con sufijo `_previous_setups_20261018`; su política `unless-stopped` queda fuera del filtro de arranque del host.

`podman-restart.service` está habilitado y su filtro `restart-policy=always` incluye exactamente `obey_bot`, `obey_images` y `obey_redis`. Se actualizaron las políticas de Compose y los manifiestos privados de recuperación, y `latest` apunta a la imagen validada. No se reinició el host para probarlo.

Antes del cambio se hizo un mongodump de 59.072.888 bytes y copia de configuración en `/home/backups/obey-releases/2026-10-18T17-37-46-511Z/`. Los snapshots privados del entorno/contenedores/manifiestos se guardan en `.runtime/deploy-setups-20261018/` con permisos restringidos. Los archivos de configuración y publicidad del contenedor anterior coinciden con los del checkout. El contexto temporal de construcción se eliminó.

Pasaron los 25 tests originales, el typecheck de bienvenida y sus reglas de dependencias. La imagen se construyó correctamente; `npm ci --omit=dev` informó 36 vulnerabilidades moderadas, ninguna alta/crítica, y avisos de paquetes obsoletos. Este despliegue no actualiza dependencias. Solo permanecen los tres archivos de tests originales; no se añadieron verificadores permanentes.

## Reversión del bot

La imagen anterior `release-panel-backoff-20261017` y su contenedor detenido se conservan. Para volver a esa imagen manteniendo el arranque automático y el mismo entorno público, ejecutar desde este checkout:

```sh
podman stop --time 30 obey_bot
podman rm obey_bot
podman run -d --name obey_bot --network host --restart always \
  --env-file /home/OBEY-YOUR-MASTER/.runtime/deploy-setups-20261018/runtime.env \
  --memory 1200m --memory-swap 2400m --stop-timeout 30 \
  --log-driver json-file --log-opt max-size=20mb \
  --volume /home/OBEY-YOUR-MASTER/.runtime/nodes:/app/runtime-nodes:ro \
  --volume /home/OBEY-YOUR-MASTER/.runtime/emojis:/app/runtime-emojis:ro \
  --health-cmd 'node -e "require(\"http\").get(\"http://127.0.0.1:3002/health\",r=>process.exit(r.statusCode===200?0:1)).on(\"error\",()=>process.exit(1))"' \
  --health-interval 30s --health-start-period 60s --health-timeout 10s --health-retries 3 \
  localhost/obey-your-master_bot:release-panel-backoff-20261017 node index.js
```

Después, comprobar `/health`, Gateway y los nodos públicos; actualizar los manifiestos privados y la referencia de despliegue para reflejar la reversión. El comando conserva Redis y el servicio de imágenes. No hay una migración de esquema que requiera restaurar la base de datos. No se ensayó una reversión durante este despliegue para evitar otra desconexión.

Continúan pendientes el recorrido interactivo de los menús de Discord, la escucha y transición de audio/failover, y la integración del proveedor Epic. La conexión saludable no verifica la calidad del audio ni la sincronización de letras. Esta operación no hizo push de la rama.
