# Guía de migración del módulo starboard

Tarea `MOD-STARBOARD`. Estado `deferred_no_confirmed_domain`. Destino propuesto `src/modules/starboard`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

No se confirmó una ruta de dominio. La primera tarea es investigar consumidores; no iniciar una implementación nueva por este documento.

No se confirmó un servicio de destacados. No crearlo como consecuencia de mover carpetas.

## Recorrido objetivo y permisos

Miembros destacan mediante reacción permitida; gestor fija umbral y destino.

1. Validar origen autorizado.
2. contar reacciones elegibles.
3. cruzar umbral.
4. crear destacado único.
5. conciliar cambios.
6. retirar o restringir si origen pierde visibilidad.

## Fuente de verdad y límites

StarboardConfig y FeaturedMessage únicos por guild/origen/destino

No copiar contenido privado a un canal más amplio. El enlace al origen no reemplaza control de audiencia del contenido copiado.

Reacción eliminada/duplicada recalcula; mensaje origen borrado aplica política de retirada. Reconciliación no inventa autores o contenido ausente.

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
| destinationChannelId | snowflake | obligatorio | Visibilidad no más amplia que fuente permitida |
| threshold | int | 3 | 1–1000 |
| emojiKey | string | star | Resolver Unicode/custom |
| sourceAllowlist | snowflake[] | [] | Vacío impide publicar hasta seleccionar fuentes |
| allowSelfStar | boolean | false | Ignorar autor |
| belowThresholdAction | enum keep,remove | keep | Contador sí se actualiza |

## Casos de aceptación escritos

### starboard FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo starboard.

Cuando Validar origen autorizado y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; retirar o restringir si origen pierde visibilidad.

### starboard RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos reacciones cruzan umbral simultáneamente.

Entonces Un único destacado se crea por mensaje origen y mantiene contador reconciliado.

### starboard RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Reacción eliminada/duplicada recalcula; mensaje origen borrado aplica política de retirada. Reconciliación no inventa autores o contenido ausente.

### starboard PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. No copiar contenido privado a un canal más amplio. El enlace al origen no reemplaza control de audiencia del contenido copiado.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
