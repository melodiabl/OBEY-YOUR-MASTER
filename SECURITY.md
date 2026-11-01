# Seguridad

## Versiones y alcance

El proyecto está en remodelación y no publica aquí una matriz de versiones con mantenimiento garantizado. El último corte operativo verificado es `2355287f`, descrito en [P0-C3](docs/platform/P0-SESSION-2026-10-31.md). Los informes delimitan las funciones revisadas; no certifican todo el bot. El código público remoto puede estar por detrás del checkout local.

La última auditoría del backend registró 50 vulnerabilidades moderadas y ninguna alta/crítica. La rotación de una credencial Mongo previa **sigue pendiente en el proveedor**; retirar una credencial de argumentos o documentación no demuestra su revocación. Las sesiones se ordenan dentro de un proceso; la aceptación distribuida continúa en P5.

## Comunicar una vulnerabilidad

**No hay todavía un contacto privado de seguridad confirmado para publicación.** Issues está desactivado y no se ha acreditado que GitHub Private Vulnerability Reporting esté habilitado. No se ofrece ese enlace como canal operativo. El mantenedor debe proporcionar y verificar un destino privado antes de cerrar este punto de G25.

Si ya tienes contacto privado con el operador afectado, comunícale el componente y una descripción mínima sin enviar secretos. No publiques credenciales ni detalles de explotación en una solicitud de cambios, chat público o captura. Guarda los pasos y el alcance para el canal privado confirmado.

El informe privado debe identificar el commit, componente, condiciones necesarias, impacto observado y reproducción mínima con cuentas/datos de prueba. No es necesario acceder a datos de otros usuarios para reportar un fallo.

## Operación

Mantén secretos y respaldos fuera de Git y del frontend. Prueba con una aplicación y datos aislados; arrancar el bot con credenciales reales puede sincronizar comandos y registrar handlers que producen efectos. Antes de actualizar un despliegue, conserva respaldo y reversión verificables. Sigue [la guía de instalación](docs/operations/INSTALACION.md) y la evidencia de la entrega concreta.
