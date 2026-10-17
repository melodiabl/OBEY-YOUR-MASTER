# Guía de migración del módulo levels

Tarea `MOD-LEVELS`. Estado `audit_before_migration`. Destino propuesto `src/modules/levels`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/RankingSchema.js`
- `handlers/cards/rankcard.js`
- `handlers/ranking.js`
- `slashCommands/Rank/leaderboard.js`
- `slashCommands/Rank/rank.js`
- `slashCommands/Rank/setlevel.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Miembro consulta progreso; gestor configura fuentes y recompensas.

1. Elegir fuentes XP.
2. definir elegibilidad/cooldowns.
3. registrar evento elegible.
4. calcular progreso.
5. conceder recompensa por versión.
6. anunciar según destino.

## Fuente de verdad y límites

XPAccount por guild/member; XPGrant idempotente; SeasonScore separado del saldo histórico

Ranking respeta visibilidad; historial y temporada son distintos. No exponer contenido de mensajes para justificar el XP.

Reprocesar evento no entrega XP ni premio dos veces. Rol no asignable deja premio pendiente; no revertir progreso ganado por fallo de notificación.

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
| xpSources | conjunto message,voice | [message] | Reacciones quedan extensión desactivada |
| messageXp | int | 20 | Default solo servidor nuevo; migrar valor existente |
| messageCooldownSeconds | int | 60 | 10–3600 por miembro |
| voiceXpPerMinute | int | 2 | No solo/AFK; elegibilidad documentada |
| rewardMode | enum stack,highest | stack | Highest solo roles de este módulo |
| seasonMode | enum none,monthly | none | No reinicia nivel histórico |
| announceDestination | enum none,current,dm,channel | none | Canal obligatorio en channel |
| rankingMode | enum lifetime,season | lifetime | Conservar ambos; congelar temporada cerrada |

## Casos de aceptación escritos

### levels FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo levels.

Cuando Elegir fuentes XP y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; anunciar según destino.

### levels RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando Dos mensajes del mismo miembro llegan dentro del mismo cooldown.

Entonces Solo el evento elegible otorga XP; no se duplica la recompensa al cruzar nivel.

### levels RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Reprocesar evento no entrega XP ni premio dos veces. Rol no asignable deja premio pendiente; no revertir progreso ganado por fallo de notificación.

### levels PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Ranking respeta visibilidad; historial y temporada son distintos. No exponer contenido de mensajes para justificar el XP.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
