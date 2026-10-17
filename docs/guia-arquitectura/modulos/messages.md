# Guía de migración del módulo messages

Tarea `MOD-MESSAGES`. Estado `audit_before_migration`. Destino propuesto `src/modules/messages`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `commands/Administration/embed.js`
- `commands/Administration/embedbuilder.js`
- `commands/Administration/updatemessage.js`
- `handlers/autoembed.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Editor crea borrador; publicador confirma canal y audiencia.

1. Seleccionar formato.
2. editar contenido/variables.
3. validar límites reales.
4. preview sintético.
5. revisar menciones.
6. confirmar publicación.
7. guardar messageId y revisión.

## Fuente de verdad y límites

MessageDefinition versionada, Publication y AllowedVariableSchema

Borradores privados por autor/equipo; preview no activa menciones; publicar requiere permiso efectivo del canal. Legacy y V2 tienen renderers separados.

Edición vieja entra en conflicto. Timeout tras enviar deja resultado desconocido y conciliación, no nueva publicación automática.

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
| name | string | obligatorio | 1–80 caracteres, único por guild |
| kind | enum plain,embed | embed | Renderer actual compatible |
| allowedEvent | enum | obligatorio | Restringe variables disponibles |
| mentionMode | enum none,subject,explicit | none | Roles explícitos revisados |
| actions | lista declarativa | [] | link o acciones internas registradas, sin JS |
| locale | string | es | Fallback de catálogo |

## Casos de aceptación escritos

### messages FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo messages.

Cuando Seleccionar formato y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; guardar messageId y revisión.

### messages RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Se confirma dos veces un mismo borrador durante timeout de Discord.

Entonces Se conserva un recibo de publicación y se concilia messageId antes de reenviar.

### messages RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Edición vieja entra en conflicto. Timeout tras enviar deja resultado desconocido y conciliación, no nueva publicación automática.

### messages PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Borradores privados por autor/equipo; preview no activa menciones; publicar requiere permiso efectivo del canal. Legacy y V2 tienen renderers separados.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
