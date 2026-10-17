# Guía de migración del módulo suggestions

Tarea `MOD-SUGGESTIONS`. Estado `audit_before_migration`. Destino propuesto `src/modules/suggestions`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `handlers/suggest.js`
- `handlers/suggestions/presentation.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Miembro propone/vota; staff revisa y decide.

1. Enviar idea.
2. validar cooldown.
3. moderación previa si activa.
4. publicar.
5. votar.
6. decidir con motivo.
7. notificar y conservar historial.

## Fuente de verdad y límites

Suggestion, Vote por usuario/propuesta, Resolution con revisión

Anonimato es público, no frente al staff autorizado; explicarlo antes de enviar. Notas internas no se incluyen en propuesta pública.

Reintento de voto reemplaza intención sin sumar otro voto. Mensaje eliminado deja estado conciliable y no publica duplicados automáticamente.

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
| channelId | snowflake | obligatorio | Canal de propuestas |
| anonymousPublic | boolean | true | Staff conserva autor; explicarlo |
| allowSelfVote | boolean | false | No voto propio por defecto |
| reviewRequired | boolean | false | Moderación previa opcional |
| cooldownSeconds | int | 300 | Por miembro |
| decisionReasonRequired | boolean | true | Aceptar/rechazar necesita explicación |

## Casos de aceptación escritos

### suggestions FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo suggestions.

Cuando Enviar idea y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; notificar y conservar historial.

### suggestions RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos clics del mismo usuario cambian voto positivo a negativo.

Entonces Queda un solo voto vigente y el recuento coincide con los votos almacenados.

### suggestions RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Reintento de voto reemplaza intención sin sumar otro voto. Mensaje eliminado deja estado conciliable y no publica duplicados automáticamente.

### suggestions PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Anonimato es público, no frente al staff autorizado; explicarlo antes de enviar. Notas internas no se incluyen en propuesta pública.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
