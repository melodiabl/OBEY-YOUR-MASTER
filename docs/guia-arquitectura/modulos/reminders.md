# Guía de migración del módulo reminders

Tarea `MOD-REMINDERS`. Estado `audit_before_migration`. Destino propuesto `src/modules/reminders`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/BirthdaySchema.js`
- `handlers/birthdayScheduler.js`
- `handlers/timedmessages.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Miembro administra recordatorios propios; gestor destinos del servidor.

1. Elegir fecha/zona y destino.
2. validar futuro.
3. guardar.
4. programar.
5. al vencer releer cancelación/destino.
6. entregar o informar fallo.
7. marcar recibo.

## Fuente de verdad y límites

Reminder, BirthdayPreference y Delivery; fechas sin año personal cuando no sea necesario

Recordatorio privado solo dueño; cumpleaños se publica únicamente por política/consentimiento configurado, sin revelar año de nacimiento.

No duplicar al reiniciar. Fallo DM no provoca envío público alternativo. Cancelar debe invalidar job anterior incluso si ya está en cola.

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
| timezone | IANA | UTC | Interpretación de entrada explícita |
| delivery | enum dm,channel | dm | Channel sujeto a permisos |
| maxActivePerUser | int | 20 | Límite de producto ajustable por servidor |
| birthdayOptIn | boolean | false | No pedir año para celebrar |
| birthdayLeapDay | enum feb28,mar1 | feb28 | Elección visible |
| mentionPolicy | enum author,none | author | No menciones masivas |

## Casos de aceptación escritos

### reminders FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo reminders.

Cuando Elegir fecha/zona y destino y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; marcar recibo.

### reminders RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando El miembro cancela cuando el job pasa de queued a running.

Entonces La comprobación previa al envío ve cancelación; si envío ya ocurrió, se informa ese resultado sin fingir retirada.

### reminders RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces No duplicar al reiniciar. Fallo DM no provoca envío público alternativo. Cancelar debe invalidar job anterior incluso si ya está en cola.

### reminders PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Recordatorio privado solo dueño; cumpleaños se publica únicamente por política/consentimiento configurado, sin revelar año de nacimiento.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
