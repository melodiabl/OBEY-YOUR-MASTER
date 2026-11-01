# Seguridad

## Versiones y alcance

El proyecto está en remodelación y no publica aquí una matriz de versiones con mantenimiento garantizado. El último corte operativo verificado es `2355287f`, descrito en [P0-C3](docs/platform/P0-SESSION-2026-10-31.md). Los informes delimitan las funciones revisadas; no certifican todo el bot. El código público remoto puede estar por detrás del checkout local.

La última auditoría del backend registró 50 vulnerabilidades moderadas y ninguna alta/crítica. La rotación de una credencial Mongo previa **no se realizó**; el mantenedor indicó expresamente que no hace falta para este cierre el 01/11/2026. Se registra como excepción de alcance, sin atribuirle una revocación o rotación inexistentes. Las sesiones se ordenan dentro de un proceso; la aceptación distribuida continúa en P5.

## Comunicar una vulnerabilidad

Usa [Report a vulnerability en GitHub](https://github.com/melodiabl/OBEY-YOUR-MASTER/security/advisories/new). El repositorio tiene **Private Vulnerability Reporting habilitado**, comprobado mediante su API el 01/11/2026. Necesitas iniciar sesión en GitHub. El reporte se dirige de forma privada a los responsables del repositorio; no se ha enviado un reporte de prueba ni se garantiza un plazo de respuesta.

No publiques credenciales ni detalles de explotación en Issues, solicitudes de cambios, chats públicos o capturas. El soporte general va a [GitHub Issues](https://github.com/melodiabl/OBEY-YOUR-MASTER/issues); una incidencia pública no es el formulario privado de seguridad.

El informe privado debe identificar el commit, componente, condiciones necesarias, impacto observado y reproducción mínima con cuentas/datos de prueba. No es necesario acceder a datos de otros usuarios para reportar un fallo.

## Operación

Mantén secretos y respaldos fuera de Git y del frontend. Prueba con una aplicación y datos aislados; arrancar el bot con credenciales reales puede sincronizar comandos y registrar handlers que producen efectos. Antes de actualizar un despliegue, conserva respaldo y reversión verificables. Sigue [la guía de instalación](docs/operations/INSTALACION.md) y la evidencia de la entrega concreta.
