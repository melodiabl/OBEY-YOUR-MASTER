# Configuración global persistente

La variable `OBEY_GLOBAL_CONFIG_DIR` selecciona un directorio privado montado con escritura. En producción: `.runtime/global-configuration` del host → `/app/runtime-configuration` del contenedor. UID/GID 1000, directorio 0700 y dos archivos 0600. No se monta el directorio de código `botconfig` ni se copia el archivo completo de configuración al almacén externo.

Campos persistentes:

| Archivo | Campos |
| --- | --- |
| config.json | prefix, ownerIDS, ownerGuildNotifications, ownerNotificationsLanguage |
| advertisement.json | adenabled |

Los esquemas son estrictos. El arranque valida ambos documentos antes de publicar sus valores en los mismos objetos que devuelve `require(botconfig/config.json)` y `require(botconfig/advertisement.json)`. Esta hidratación ocurre antes de cargar handlers, eventos o servicios. Los lectores antiguos conservan su referencia. El indicador de publicidad se restaura también en `client.ad`; su actividad se convierte a un `ActivityType` numérico sin modificar los materiales originales.

Los demás campos, credenciales, textos y materiales continúan procediendo de la configuración de la imagen y de las variables de entorno existentes. El antiguo `changestatus` sigue escribiendo su JSON de la capa del contenedor: su migración y revisión no forman parte de este cambio. Su comportamiento previo al reiniciar el mismo contenedor se conserva; esos campos aún no sobreviven a recrearlo. Las revisiones de comandos Owner restantes, recibos y exclusión entre procesos siguen pendientes.

Con la variable ausente se mantiene el funcionamiento local anterior. Una variable vacía, ruta relativa, directorio ausente, archivo ausente, enlace simbólico, archivo no regular, documento mayor de 64 KiB o esquema inválido detiene el arranque con un error saneado. No existe una alternativa silenciosa a valores antiguos. La ubicación y el acceso del volumen deben prepararse antes de arrancar.

Primera migración en este despliegue Linux con Podman y usuario node 1000:

1. Construir/verificar imagen y respaldo antes de detener el bot.
2. Detener el contenedor anterior para drenar los ajustes aceptados.
3. Ejecutar `node scripts/initialize-global-configuration.js --from-container <contenedor-detenido>`. Solo admite un contenedor detenido; extrae los cinco campos, valida y publica el directorio completo. No reemplaza un almacén existente: lo valida y conserva. La inicialización sin argumentos sirve para desarrollo desde los archivos del checkout y se rechaza si hay una ruta de producción configurada sin inicializar.
4. Arrancar la imagen nueva con la variable y el volumen; comprobar permisos, proyección migrada, salud, HTTP y recursos.
5. Conservar la imagen anterior y el directorio persistente. El respaldo guarda ambos documentos y un manifiesto de hashes, sin imprimir su contenido.

Recrear el contenedor nuevo reutiliza ese directorio. No se copia otra vez desde la imagen ni se reemplazan los ajustes al desplegar código. Un operador que edite los archivos manualmente debe validarlos y reiniciar el proceso; la recarga externa en caliente no se ofrece.

Para revertir a una imagen anterior a esta migración, se conserva el directorio persistente y el contenedor anterior con su última configuración. Esa imagen usa sus JSON originales; para aplicar en ella cambios aceptados después de la migración hay que combinar la proyección respaldada con sus archivos antes de arrancarla. Nunca se reemplaza un documento completo con una proyección parcial ni se borra el almacén persistente al revertir. Volver a una imagen compatible recupera el directorio directamente.
