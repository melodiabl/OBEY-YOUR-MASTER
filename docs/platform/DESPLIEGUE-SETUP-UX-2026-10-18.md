# Despliegue de configuración guiada

El 18/10/2026 se desplegó `3673b478678d368ee5637e6562c3b6754b402574`, imagen `release-setup-ux-20261018-3673b47`, después de la revisión del usuario sobre los setups. [Evidencia de ejecución](evidence/setup-usability-deployment-20261018.json); [alcance y comprobaciones locales](../guia-arquitectura/FACILIDAD_SETUP.md).

El recorrido comienza con `!setup`: elegir una función, abrir sus ajustes y volver desde el mismo mensaje. No exige escribir comandos separados. Los nombres explican la finalidad, las entradas equivalentes se agrupan y los cambios pendientes deben guardarse o descartarse antes de regresar. Bienvenida/tickets/música tienen una ruta básica; las opciones avanzadas y los comandos existentes siguen accesibles. Los paneles publicados y sus customIds no se migran ni se recrean por desplegar esta versión.

Los 19 archivos de implementación/catálogos modificados coinciden por SHA-256 con los del contenedor. Gateway conectado con heartbeat reconocido; MongoDB listo; 19 comandos slash registrados; bot, Redis e imágenes saludables y sin reinicios. La salud local y HTTPS pública devuelve 200 con `database=true` y `music=true`.

Se mantienen GDjkhp, Serenetia y MilloHost; los tres conectaron. Lavalink privado permanece deshabilitado y sin iniciar. Redis e imágenes no se recrearon. Los tres servicios conservan `restart=always` y el arranque de Podman habilitado. No se hicieron cambios de esquema, backfill, nuevas dependencias ni pruebas de escucha o menús con usuarios reales.

Se conservaron la imagen anterior `release-setups-20261018-f4acfac`, los snapshots privados en `.runtime/deploy-setup-ux-20261018/` y el backup Mongo/configuración en `/home/backups/obey-releases/2026-10-18T18-47-03-421Z/` (archivo Mongo de 59.078.741 bytes). Configuración de dueño/publicidad comparada antes del relevo: coincide con el checkout. El contexto temporal de construcción se eliminó; los dos manifiestos privados y `latest` apuntan a la imagen nueva. No se retuvo otra instancia del bot con política `always` que pudiera arrancar junto a la actual.

## Reversión

Desde el checkout, la receta privada reproduce el contenedor anterior con el mismo entorno, mounts, límites y política de reinicio. No contiene una operación de restauración de base de datos ni afecta Redis, imágenes o Lavalink privado:

```sh
python3 - <<'PY'
import json, pathlib, subprocess
recipe = json.loads(pathlib.Path('.runtime/deploy-setup-ux-20261018/rollback-arguments.json').read_text())
assert recipe[:2] == ['podman', 'create']
assert recipe[recipe.index('--name') + 1] == 'obey_bot'
assert 'f9cd56364741bab8f14d3b701b09b13b67d892fe7282c6e31a4c4efbf2fa79fe' in recipe
subprocess.run(['podman', 'stop', '--time', '30', 'obey_bot'], check=True)
subprocess.run(['podman', 'rm', 'obey_bot'], check=True)
subprocess.run(recipe, check=True)
subprocess.run(['podman', 'start', 'obey_bot'], check=True)
PY
```

Comprobar `/health`, Gateway y conexiones públicas después de revertir; actualizar la referencia de despliegue y los manifiestos privados. La receta y la imagen anterior están disponibles; no se ejecutó esta reversión durante el despliegue.

Los 58 grupos temporales, 100 ciclos y 25 tests originales pasaron antes de construir. El script temporal, la base aislada y su contenedor/volúmenes se eliminaron. La validación de facilidad de uso con el usuario en Discord queda pendiente. Las tareas globales del ZIP y la integración Epic siguen abiertas; no hubo push remoto.
