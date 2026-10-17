# Guía de migración del módulo collections

Tarea `MOD-COLLECTIONS`. Estado `deferred_no_confirmed_domain`. Destino propuesto `src/modules/collections`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

No se confirmó una ruta de dominio. La primera tarea es investigar consumidores; no iniciar una implementación nueva por este documento.

No se confirmó el dominio de colecciones originales. Los juegos existentes no acreditan álbum, inventario ni trading.

## Recorrido objetivo y permisos

Miembro reclama/consulta propio inventario; terceros según visibilidad.

1. Usar catálogo con permisos registrados.
2. evaluar cooldown/requisitos.
3. reservar entrega.
4. conceder elemento único.
5. mostrar inventario/álbum.
6. aplicar favorito.

## Fuente de verdad y límites

Catalog, CardDefinition, CardCopy, ClaimOperation y Trade con reservas

Solo material original o autorizado; álbum respeta privacidad; no reutilizar imágenes de otro bot por ser públicas.

Reintento no concede duplicado accidental. Trading permanece deshabilitado hasta transacción y doble aceptación; no convierte consulta de álbum en reclamación.

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
| catalogIds | lista | [] | Fuente y permiso de uso registrados para cada recurso |
| claimCooldownSeconds | int | 3600 | Propuesta 60–86400 por miembro/guild |
| tradingEnabled | boolean | false | Intercambio local con doble aceptación |
| duplicatePolicy | enum allow,convert | allow | Conversión con tasa publicada |
| eventExclusive | boolean | false | Exclusividad solo por evento explícito |

## Casos de aceptación escritos

### collections FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo collections.

Cuando Usar catálogo con permisos registrados y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; aplicar favorito.

### collections RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos solicitudes de reclamar usan el mismo cooldown y recibo.

Entonces Una sola entrega consume elegibilidad y queda una entrada de inventario.

### collections RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Reintento no concede duplicado accidental. Trading permanece deshabilitado hasta transacción y doble aceptación; no convierte consulta de álbum en reclamación.

### collections PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Solo material original o autorizado; álbum respeta privacidad; no reutilizar imágenes de otro bot por ser públicas.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
