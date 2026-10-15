# Recuperación de letras y limpieza — 2026-10-15

El panel de THZ dejó de editarse a las 00:23:50 UTC, justo antes del reinicio del bot a las 00:23:51 UTC. Los intervalos y la referencia al mensaje vivían únicamente en memoria.

La configuración de MusicGuild conserva ahora la activación y los identificadores del panel. El arranque recupera el mismo mensaje, comprueba su autor y servidor y usa el reloj compartido de reproducción. Cuando no hay música queda a la espera de la próxima canción. El apagado suspende los intervalos sin desactivar el panel guardado.

La web mantiene visible el verso activo dentro de su zona de desplazamiento y conserva el desplazamiento manual mientras no cambia de página. La prueba del navegador reproduce el verso que antes quedaba fuera del área visible.

Verificación: 409 pruebas de Node aprobadas; navegador real con transporte simulado, escritorio y móvil, sin errores. Estas pruebas no sustituyen una comprobación del mensaje real tras desplegar.

Se retiraron tres programas de prueba de voz y su entrada especial de arranque. La limpieza eliminó 486 elementos temporales obsoletos (4.207.506.654 bytes); el detalle está en evidence/unused-cleanup.json. Se conserva el material del ZIP nuevo y la configuración activa.
