# Guía de migración del módulo logs

Tarea `MOD-LOGS`. Estado `audit_before_migration`. Destino propuesto `src/modules/logs`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `handlers/boostlog.js`
- `handlers/ghost_ping_detector.js`
- `handlers/logger.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor configura destinos; lector autorizado consulta registros.

1. Elegir categorías.
2. definir destino y exclusiones.
3. habilitar contenido solo si corresponde.
4. generar evento redactado.
5. entregar.
6. guardar estado de entrega.

## Fuente de verdad y límites

LogEvent con origen, evidencia, cobertura y fecha; Delivery separado de captura

Nunca ampliar visibilidad del contenido origen por reenviarlo; actor desconocido se presenta como desconocido, sin atribuir al último audit log arbitrario.

Destino eliminado pausa ese destino y alerta al gestor; reintento con deduplicación. Excluir canal no suprime eventos críticos propios del sistema.

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
| destinations | mapa categoría→canal | {} | Canal del mismo servidor |
| excludedChannelIds | snowflake[] | [] | No suprime auditoría crítica del sistema |
| contentRetentionDays | int | 30 | 7–365 para contenido |
| auditRetentionDays | int | 90 | 30–365 |
| includeMessageContent | boolean | false | Solo si capacidad y permisos lo permiten |

## Casos de aceptación escritos

### logs FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo logs.

Cuando Elegir categorías y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; guardar estado de entrega.

### logs RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Un cambio genera evento Gateway y entrada de auditoría cercanos.

Entonces La correlación mantiene incertidumbre si no puede confirmar actor; no atribuye por proximidad temporal solamente.

### logs RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Destino eliminado pausa ese destino y alerta al gestor; reintento con deduplicación. Excluir canal no suprime eventos críticos propios del sistema.

### logs PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Nunca ampliar visibilidad del contenido origen por reenviarlo; actor desconocido se presenta como desconocido, sin atribuir al último audit log arbitrario.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
