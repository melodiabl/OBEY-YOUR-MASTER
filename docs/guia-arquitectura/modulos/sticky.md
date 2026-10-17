# Guía de migración del módulo sticky

Tarea `MOD-STICKY`. Estado `audit_before_migration`. Destino propuesto `src/modules/sticky`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/StickySchema.js`
- `handlers/sticky/discord-transport.js`
- `handlers/sticky/mongo-store.js`
- `handlers/sticky/service.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor habilita por canal; bot concilia único mensaje vigente.

1. Seleccionar canal/plantilla.
2. preview.
3. habilitar.
4. contar mensajes elegibles.
5. esperar debounce.
6. verificar mensaje vigente.
7. reemplazar por recibo.
8. reconciliar.

## Fuente de verdad y límites

StickySchema existente y OperationReceipt; envío desconocido requiere reconciliar

El contenido tiene la misma audiencia del canal; no copiar plantilla privada ni menciones no autorizadas. Mensajes propios no disparan repost.

Job usa revisión/generación; pausar invalida pendientes. Enviar nuevo y borrar anterior son efectos separados: mantener referencia si borrado falla.

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
| channelId | snowflake | obligatorio | Canal autorizado |
| templateId | referencia | obligatoria | Versión publicada |
| debounceSeconds | int | 30 | Propuesta 10–600 |
| minMessages | int | 5 | Propuesta 1–100; excluir bot |
| enabled | boolean | false | Pausar conserva configuración |

## Casos de aceptación escritos

### sticky FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo sticky.

Cuando Seleccionar canal/plantilla y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; reconciliar.

### sticky RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos eventos activan repost antes de finalizar debounce.

Entonces Un solo job efectivo publica; el segundo concilia la referencia ya vigente.

### sticky RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Job usa revisión/generación; pausar invalida pendientes. Enviar nuevo y borrar anterior son efectos separados: mantener referencia si borrado falla.

### sticky PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. El contenido tiene la misma audiencia del canal; no copiar plantilla privada ni menciones no autorizadas. Mensajes propios no disparan repost.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
