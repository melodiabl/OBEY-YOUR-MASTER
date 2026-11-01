# P0-C5 · verificación local de base · 01/11/2026

> Actualización posterior · 01/11/2026: [soporte y publicación remota](P0-REMOTE-2026-11-01.md). GitHub Issues y reporte privado ya están habilitados/verificados. El usuario excluyó expresamente la rotación Mongo del cierre; no se realizó. Los estados y limitaciones de abajo conservan el corte anterior; la aceptación posterior se registra en ese informe y en el plan activo.

**Resultado local correcto; aceptación final de P0 pendiente.** El corte comprueba los criterios locales originales de G01/G02, sin exigir remodelar primero los otros 493 comandos y 61 rutas de sus capacidades. G25 continúa sin contactos públicos/privados confirmados, C2 conserva la rotación Mongo en el proveedor y no se ha ejecutado el CI remoto de este cambio. No se avanza una puerta de fase por contar archivos.

Código de CI `5703f837`, sobre el checkout `c469c93d`. Imagen de verificación `b983df5e3570`; no se desplegó. El bot conserva código `2355287f`, imagen `7bf3d9f8b4d3`, saludable y con cero reinicios observados. No cambiaron manifests, lockfiles, código de aplicación, credenciales o datos.

## G01: instalación y compilación exactas

Se extrajo un contexto nuevo exclusivamente de archivos Git y el cambio de CI, sin `.env`, `.runtime`, `node_modules` o artefactos Next del host. El Dockerfile real se construyó con `--no-cache`: instalación frontend, exportación Next y nueva instalación de producción con sus dependencias nativas. Node **22.23.4**, Undici integrado **6.29.1**, npm **10.9.9**. La imagen configura UID1000 y las comprobaciones se ejecutan con ese usuario; Canvas nativo, Canvas legacy y Opus realizan operaciones mínimas sobre datos sintéticos.

En otro directorio limpio se instalaron dependencias de desarrollo y frontend con `npm ci`, con Node22.23.4 y caché npm inicialmente vacía, usando la imagen anterior solo como base de bibliotecas nativas. Los dos manifests y lockfiles permanecen idénticos a su fuente. Tipos de bienvenida, fronteras (1.175 módulos/3.391 dependencias), tipos del frontend, clasificación y recursos pasan. Los **25 tests originales pasan tanto en desarrollo recién instalado como en la imagen nueva**, sin fallos ni casos omitidos.

La auditoría del backend mantiene **50 moderadas, cero altas/críticas**; frontend, cero avisos. El snapshot sin umbral retorna 1 por moderadas; ambos comandos reales con `--audit-level=high` pasan. No se silencian los avisos ni se aplican actualizaciones masivas. La instalación aislada congelada de lavalink-client2.11.0/ws8.22.0 también pasa; ese cliente sigue fuera de producción y no se crea otra cola musical.

## G02: los candidatos originales frente al registro

Los 674 paths del CSV original se comparan con cada propietario cargado: **674 − 14 retirados + `slashCommands/setup.js` = 661**. Las catorce diferencias coinciden exactamente con las retiradas documentadas de C2. No hay adaptadores adicionales sin explicar.

Los cargadores reales `handlers/command` y `handlers/slashCommands`, con sus exports reales, producen **517 comandos de texto, 144 invocaciones slash, 20 raíces y 776 alias**. Coinciden los IDs, la identidad de cada export/propietario y los destinos de todos los alias. Las colisiones conservan [la política explícita](../../handlers/command-registry.js); el catálogo se valida con la misma normalización de publicación. Tres alteraciones sintéticas —entrada ausente, propietario incorrecto y alias incorrecto— son rechazadas por el nuevo control.

La composición real de Express registra exactamente las **95 rutas**, incluidos método, path y cantidad de handlers. Se mantienen los módulos de rutas reales; solo se sustituye MongoStore por memoria y se impide abrir el listener. En los cargadores únicamente se sustituye el scheduler de sorteos. Los contenedores de estas comprobaciones no tienen red, no hacen login, no ejecutan comandos ni solicitudes HTTP, y los métodos REST del cliente están bloqueados. Esto acredita registro en staging aislado, no el funcionamiento de cada comando, un recorrido OAuth real o la aceptación entre dos guilds.

Se verifican los **1.046 hashes** del inventario, manifests y dependencias declaradas. Inventario y revisión funcional siguen en 661/95 y 52 grupos/168 comandos/34 rutas; no se aumentan por esta comprobación.

## Corrección del CI

El PR solo activaba controles contra `feat/motor-soundy`; faltaban los destinos activos y `master`. Una comprobación reprodujo esa carencia antes del cambio. Ahora los PR cubren esas tres ramas y los pushes cubren `master` y `feature/obey-main-implementation`. Se conservan acciones fijadas por SHA, permisos mínimos y los controles anteriores. Se añaden instalación/tipos frontend, caché de ambos locks, auditorías de backend/frontend y comparación de cargadores reales dentro de la imagen sin red. No se añade una batería de tests ni scripts auxiliares permanentes.

La configuración YAML y el shell de sus pasos se validan, y los comandos pertinentes se ejecutan localmente con resultados correctos. **Esto no es una ejecución de GitHub Actions.** La consulta de solo lectura registra cero runs para la revisión consultada; la rama remota seguía en `c8ba6d3`, mientras los cambios de esta entrega son locales. No se hizo push, se activaron servicios de soporte ni se cambiaron reglas remotas de protección.

## Cierre y siguiente paso

Se conservan logs y [evidencia resumida](evidence/p0-final-verification-20261101.json). Los directorios de instalación, fixtures y scripts temporales se retiran junto a la imagen de comprobación sin uso; permanecen los tres tests originales, el runtime y las imágenes de reversión existentes. Los controles permanentes están en el workflow y en el validador de clasificación ya existente.

Los criterios locales de G01/G02 quedan demostrados para este corte. La aceptación global sigue abierta hasta resolver Mongo/soporte y verificar el estado remoto del corte que se publique. P1 conserva la siguiente fase del plan, con migración musical, cola, controles y continuidad; los pendientes externos no se sustituyen por más revisión de comandos sueltos de P2/P6.
