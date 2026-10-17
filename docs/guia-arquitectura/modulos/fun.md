# Guía de migración del módulo fun

Tarea `MOD-FUN`. Estado `audit_before_migration`. Destino propuesto `src/modules/fun`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `handlers/games-choice.js`
- `handlers/games.js`
- `handlers/games/board-image.js`
- `handlers/pokemon-game.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Miembro inicia sesión; anfitrión controla cierre; gestores habilitan proveedores.

1. Elegir juego/acción habilitada.
2. validar edad/canal si corresponde.
3. fijar reglas y participantes.
4. iniciar sesión.
5. procesar turnos válidos.
6. finalizar o expirar.

## Fuente de verdad y límites

GameSession por guild/channel/juego; catálogo proveedor con permisos de contenido

Contenido adulto nunca se mezcla con catálogo general. Acción contra otro miembro respeta opt-out y no se vuelve acoso por repetición.

Collector vencido deja controles deshabilitados. Respuesta de proveedor tardía no reemplaza una ronda nueva; fallback explica indisponibilidad sin contenido falso.

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
| enabledGames | conjunto IDs existentes | conservar | Inventario obligatorio |
| cooldownSeconds | int | 10 | Por juego y usuario |
| allowTargetOptOut | boolean | true | Para interacciones sociales dirigidas |
| publicResults | boolean | true | Privacidad según tipo |
| economyRewardsEnabled | boolean | false | No integrar saldos sin ledger y balance definidos |

## Casos de aceptación escritos

### fun FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo fun.

Cuando Elegir juego/acción habilitada y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; finalizar o expirar.

### fun RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Una respuesta llega para una ronda ya cerrada.

Entonces Se rechaza por sessionId/turno y conserva el resultado final.

### fun RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Collector vencido deja controles deshabilitados. Respuesta de proveedor tardía no reemplaza una ronda nueva; fallback explica indisponibilidad sin contenido falso.

### fun PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Contenido adulto nunca se mezcla con catálogo general. Acción contra otro miembro respeta opt-out y no se vuelve acoso por repetición.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
