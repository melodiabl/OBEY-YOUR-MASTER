# Guía de migración del módulo migrations

Tarea `MOD-MIGRATIONS`. Estado `audit_before_migration`. Destino propuesto `src/modules/migrations`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `handlers/music/playlist-repository.js`

Se encontró conciliación de playlists específica. No presentarla como importador universal de datos o sistemas de otros bots.

## Recorrido objetivo y permisos

Gestor autorizado revisa formato, mapping y diff.

1. Seleccionar adaptador soportado.
2. importar archivo validado.
3. preflight.
4. mapear roles/canales locales.
5. dry-run.
6. confirmar revisión.
7. aplicar lotes con checkpoint.
8. verificar conciliación.

## Fuente de verdad y límites

MigrationRun, Mapping y Checkpoint; snapshot antes de transformaciones destructivas

Solo export autorizado por el usuario; no leer bases privadas de otros bots ni fingir import universal. Redactar secretos y datos fuera de scope.

Reintento retoma checkpoint. Conflicto keep/replace se muestra por campo. Rollback comprueba escrituras nuevas y no borra cambios posteriores legítimos.

## Pasos concretos de reorganización

1. Relacionar cada entrada real con una acción de negocio. Leer los archivos candidatos y completar referencias adicionales; esta lista no es un grafo exhaustivo.
2. Identificar la colección o estado propietario y los efectos externos de esa acción. Registrar todo acceso directo que deba migrar.
3. Extraer el caso de uso pequeño y sus políticas. Si ya hay un servicio, adaptarlo; no crear otro con nombre distinto.
4. Hacer que una entrada delegue y comprobar permiso, efecto y respuesta. Migrar las demás superficies ofrecidas, conservando aliases y customIds.
5. Mantener un adaptador legacy hasta no encontrar consumidores. Aislar el acceso al cliente global detrás de ese adaptador cuando sea necesario.
6. Separar cambios de archivos y cambios de datos. Si hace falta migración, escribir mapping, checkpoint, lectura compatible y rollback antes de ejecutar.
7. Retirar lógica vieja con evidencia de referencias y recorrido; no eliminarla por tener una carpeta nueva.

## Configuración objetivo por conciliar

Campos de diseño de los contratos anteriores. No son claves runtime confirmadas: registrar clave legacy, tipo real, valor existente y fuente canónica antes de adaptarlos. Preservar ausente, null y false como estados distintos.

| Campo | Tipo | Default de diseño | Regla del contrato |
| --- | --- | --- | --- |
| sourceAdapter | enum registrado | obligatorio | Formato/versiones documentados |
| mode | enum preview,apply | preview | Aplicar después del diff |
| mapping | mapa | {} | Roles/canales locales; no IDs de otra guild |
| conflictPolicy | enum keep,replace | keep | Mostrar reemplazos |
| batchSize | int | 100 | Propuesta 1–1000 |

## Casos de aceptación escritos

### migrations FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo migrations.

Cuando Seleccionar adaptador soportado y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; verificar conciliación.

### migrations RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando El miembro cambia un dato entre dry-run y lote que iba a reemplazarlo.

Entonces La revisión del campo detecta conflicto y respeta la política elegida con evidencia.

### migrations RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Reintento retoma checkpoint. Conflicto keep/replace se muestra por campo. Rollback comprueba escrituras nuevas y no borra cambios posteriores legítimos.

### migrations PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Solo export autorizado por el usuario; no leer bases privadas de otros bots ni fingir import universal. Redactar secretos y datos fuera de scope.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
