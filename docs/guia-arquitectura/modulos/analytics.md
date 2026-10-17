# Guía de migración del módulo analytics

Tarea `MOD-ANALYTICS`. Estado `audit_before_migration`. Destino propuesto `src/modules/analytics`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/StatsSchema.js`
- `database/schemas/UserStatsSchema.js`
- `handlers/NumberCounter.js`
- `handlers/membercount.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor consulta agregados; miembro propio si política permite.

1. Elegir métrica definida.
2. periodo.
3. filtros autorizados.
4. mostrar cobertura y zona.
5. consultar agregado.
6. exportar solo campos permitidos.

## Fuente de verdad y límites

MetricDefinition, Bucket y TrackingPreference; no guardar contenido por defecto

No presentar historial no recopilado como cero. Usuarios ocultos no aparecen con identidad en export público; datos de servidor nunca cruzan guild.

Ingesta usa deduplicación; agregados tienen versión/fecha de cálculo. Caída del recolector muestra hueco y última actualización, no falsa continuidad.

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
| messageMetadataEnabled | boolean | false | Contar eventos, no texto por defecto |
| voiceMetricsEnabled | boolean | false | Solo intervalos observados |
| retentionDays | int | 90 | 30–365 |
| timezone | IANA | UTC | Agrupación visible |
| excludeBots | boolean | true | Aplicado a todas las series comparables |
| inviteAttributionEnabled | boolean | false | best_effort, nunca garantía |
| collectionExclusions | canales/roles | [] | Decide ingestión, no solo visualización |
| displayFilters | mapa | {} | Filtrar no borra datos |
| cohortDays | lista | [7,30] | Solo cohortes maduras; denominador explícito |

## Casos de aceptación escritos

### analytics FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo analytics.

Cuando Elegir métrica definida y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; exportar solo campos permitidos.

### analytics RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Se reprocesa un lote de eventos ya agregado después de reiniciar.

Entonces Los contadores no aumentan dos veces y la cobertura conserva el hueco real.

### analytics RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Ingesta usa deduplicación; agregados tienen versión/fecha de cálculo. Caída del recolector muestra hueco y última actualización, no falsa continuidad.

### analytics PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. No presentar historial no recopilado como cero. Usuarios ocultos no aparecen con identidad en export público; datos de servidor nunca cruzan guild.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
