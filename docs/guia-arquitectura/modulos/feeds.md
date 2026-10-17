# Guía de migración del módulo feeds

Tarea `MOD-FEEDS`. Estado `audit_before_migration`. Destino propuesto `src/modules/feeds`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/TikTokSchema.js`
- `database/schemas/YouTubeSchema.js`
- `social_log/livelog.js`
- `social_log/streamconfig.json`
- `social_log/tiktok.js`
- `social_log/twitter.json`
- `social_log/twitterfeed.js`
- `social_log/twitterfeed2.js`
- `social_log/youtube.js`
- `social_log/youtubelog/placeholder.txt`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor conecta fuente/destino; miembros ven publicaciones autorizadas.

1. Elegir proveedor soportado.
2. validar fuente.
3. filtrar.
4. preview de contenido.
5. guardar cursor.
6. detectar novedades.
7. deduplicar.
8. entregar con recibo.

## Fuente de verdad y límites

FeedConnection, FeedCursor, ItemReceipt y Delivery; credenciales fuera de export

No exponer claves, URLs firmadas o feeds privados en destino público. Mostrar proveedor no equivale a licencia para reproducir su contenido.

Cursor no avanza perdiendo publicaciones sin recibo. Backoff/circuit breaker ante caída; recuperación evita inundar con todo el historial.

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
| sourceType | enum rss,provider | rss | Provider requiere adaptador y credenciales válidas |
| sourceUrl | HTTPS URL | obligatoria | Validar destino público,redirecciones y tamaño |
| pollIntervalMinutes | int | 15 | Mínimo 5 solo si fuente/cuota lo permite |
| initialSync | enum baseline,lastItem | baseline | Baseline no vuelca historial |
| filters | lista contains,exclude | [] | Campos permitidos |
| messageTemplateId | referencia | base feed | Contexto feed.item |

## Casos de aceptación escritos

### feeds FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo feeds.

Cuando Elegir proveedor soportado y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; entregar con recibo.

### feeds RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando El proveedor repite el mismo elemento con distinta fecha de consulta.

Entonces Identidad estable evita una segunda publicación; se actualiza solo según política configurada.

### feeds RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Cursor no avanza perdiendo publicaciones sin recibo. Backoff/circuit breaker ante caída; recuperación evita inundar con todo el historial.

### feeds PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. No exponer claves, URLs firmadas o feeds privados en destino público. Mostrar proveedor no equivale a licencia para reproducir su contenido.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
