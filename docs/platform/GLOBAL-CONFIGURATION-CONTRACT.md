# Configuración global persistente

La variable `OBEY_GLOBAL_CONFIG_DIR` selecciona un directorio privado montado con escritura. En producción: `.runtime/global-configuration` del host → `/app/runtime-configuration` del contenedor. UID/GID 1000, directorio 0700 y tres archivos 0600. No se monta el directorio de código `botconfig` ni se copia el archivo completo de configuración al almacén externo.

Campos persistentes:

| Archivo | Campos |
| --- | --- |
| config.json | prefix, ownerIDS, ownerGuildNotifications, ownerNotificationsLanguage |
| advertisement.json | adenabled |
| status.json | status: text, text2, type, url, presence |

Los esquemas son estrictos. El arranque valida los tres documentos antes de publicar sus valores en los mismos objetos que devuelve `require(botconfig/config.json)` y `require(botconfig/advertisement.json)`. El objeto status procede de status.json y se publica dentro del mismo config compartido. Esta hidratación ocurre antes de cargar handlers, eventos o servicios. Los lectores antiguos conservan su referencia. El indicador de publicidad se restaura también en `client.ad`; su actividad se convierte a un `ActivityType` numérico sin modificar los materiales originales.

Los demás campos, credenciales, textos y materiales continúan procediendo de la configuración de la imagen y de las variables de entorno existentes. `changestatus` usa un borrador y confirma el archivo antes de cambiar la memoria y solicitar la presencia; disponibilidad y los dos textos sobreviven a recrear el contenedor. La solicitud no equivale a un ACK de Discord. Las revisiones de comandos Owner restantes, recibos y exclusión entre procesos siguen pendientes.

Con la variable ausente se mantiene el funcionamiento local anterior. Una variable vacía, ruta relativa, directorio ausente, archivo ausente, enlace simbólico, archivo no regular, documento mayor de 64 KiB o esquema inválido detiene el arranque con un error saneado. No existe una alternativa silenciosa a valores antiguos. La ubicación y el acceso del volumen deben prepararse antes de arrancar.

Primera migración en este despliegue Linux con Podman y usuario node 1000:

1. Construir/verificar imagen y respaldo antes de detener el bot.
2. Detener el contenedor anterior para drenar los ajustes aceptados.
3. Ejecutar `node scripts/initialize-global-configuration.js --from-container <contenedor-detenido>`. Solo admite un contenedor detenido; extrae los campos migrados, valida y publica el directorio completo. Si existe el formato anterior de dos documentos, añade solo status.json desde ese origen detenido; no cambia ninguno de los dos archivos existentes ni reemplaza un status.json ya presente. La inicialización sin argumentos sirve para desarrollo desde los archivos del checkout y se rechaza si hay una ruta de producción configurada sin inicializar.
4. Arrancar la imagen nueva con la variable y el volumen; comprobar permisos, proyección migrada, salud, HTTP y recursos.
5. Conservar la imagen anterior y el directorio persistente. El respaldo guarda los tres documentos y un manifiesto de hashes, sin imprimir su contenido.

Recrear el contenedor nuevo reutiliza ese directorio. No se copia otra vez desde la imagen ni se reemplazan los ajustes al desplegar código. Un operador que edite los archivos manualmente debe validarlos y reiniciar el proceso; la recarga externa en caliente no se ofrece.

Para revertir a una imagen anterior a esta migración, se conserva el directorio persistente y el contenedor anterior con su última configuración. Esa imagen usa sus JSON originales; para aplicar en ella cambios aceptados después de la migración hay que combinar la proyección respaldada con sus archivos antes de arrancarla. Nunca se reemplaza un documento completo con una proyección parcial ni se borra el almacén persistente al revertir. Volver a una imagen compatible recupera el directorio directamente.

Restauración de un respaldo actual: detener el bot, conservar aparte el directorio vigente, copiar config.json, advertisement.json y status.json del mismo respaldo a un directorio privado de preparación, comprobar el manifiesto de hashes y ejecutar readGlobalConfiguration sobre ese directorio con el código actual. Ajustar propietario 1000:1000, directorio 0700 y archivos 0600; publicar el directorio validado y arrancar. No mezclar documentos de distintos respaldos.

Un respaldo antiguo puede tener solo dos documentos. El arranque nuevo no lo acepta directamente. Restaurar esos dos con el bot detenido y ejecutar el inicializador con --from-container sobre el contenedor antiguo detenido para incorporar el estado disponible en él. Ese estado no se presenta como una captura histórica de la fecha del respaldo. Si no existe un origen recuperable, preparar explícitamente un status.json validado con valores elegidos por el operador antes de arrancar; nunca asumir valores en silencio. El lector permisivo del respaldo previo se limita a esta transición y no se usa en el arranque.

La imagen inmediatamente anterior a la migración de estado ignora el archivo adicional status.json y continúa usando los dos documentos originales. Conservar los tres al revertir; la imagen nueva recupera los cambios de estado guardados. Para aplicar también ese estado a una imagen antigua durante la reversión, combinar el objeto status con su config.json completo antes de arrancar, sin introducir status dentro de la proyección estricta config.json del volumen.
