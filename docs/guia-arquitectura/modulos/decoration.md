# Guía de migración del módulo decoration

Tarea `MOD-DECORATION`. Estado `audit_before_migration`. Destino propuesto `src/modules/decoration`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `handlers/architect/decoration.js`
- `handlers/architect/themes.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor elige recursos y preset; preview obligatorio.

1. Seleccionar canales.
2. conservar significado.
3. aplicar transformaciones permitidas en preview.
4. detectar nombres inválidos/conflictos.
5. confirmar lote.
6. registrar nombre anterior/nuevo.

## Fuente de verdad y límites

DecorationPlan por objeto y revisión; autoridad de recurso registrada

Estética de canales Discord no se traslada como imágenes al panel interno. Mantener nombres legibles y accesibles.

Cada rename tiene revisión; conflicto stop/skip según configuración. Restaurar solo si el nombre actual sigue siendo el último aplicado por esa operación.

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
| scope | enum selected,category | selected | Selección de canales explícita |
| preset | referencia | obligatorio | Separadores/emojis permitidos |
| preserveMeaning | boolean fijo | true | Mantener parte legible del nombre |
| includeVoice | boolean | false | Activar por selección |
| maxChanges | int | 50 | Lote inicial; ampliar por plan |
| conflictPolicy | enum stop,skip | stop | Nombre inválido/duplicado se informa |

## Casos de aceptación escritos

### decoration FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo decoration.

Cuando Seleccionar canales y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; registrar nombre anterior/nuevo.

### decoration RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Un gestor cambia manualmente un nombre antes de revertir decoración.

Entonces Se conserva el nombre manual y se informa conflicto en esa entrada.

### decoration RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Cada rename tiene revisión; conflicto stop/skip según configuración. Restaurar solo si el nombre actual sigue siendo el último aplicado por esa operación.

### decoration PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Estética de canales Discord no se traslada como imágenes al panel interno. Mantener nombres legibles y accesibles.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
