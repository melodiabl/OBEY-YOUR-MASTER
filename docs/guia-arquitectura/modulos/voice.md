# Guía de migración del módulo voice

Tarea `MOD-VOICE`. Estado `audit_before_migration`. Destino propuesto `src/modules/voice`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `database/schemas/JTCSchema.js`
- `handlers/jointocreate.js`
- `handlers/joinvc.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Propietario de sala y staff con capacidad; visitantes según permisos.

1. Entrar en generador.
2. reservar creación.
3. crear sala y dueño.
4. abrir controles.
5. modificar con revisión.
6. al quedar vacía iniciar gracia.
7. comprobar y eliminar si sigue vacía.

## Fuente de verdad y límites

VoiceGenerator, TemporaryChannel, OwnerTransfer y CleanupJob con revisión

Solo dueño/staff modifica; invitado accede según permisos efectivos. El panel antiguo pierde autoridad al transferir propiedad.

Reinicio concilia canales existentes y propietarios; no borrar una sala reocupada por un job viejo. Claim requiere ausencia del dueño según política del módulo.

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
| generatorChannelId | snowflake | obligatorio | Canal de voz existente |
| categoryId | snowflake | obligatorio | Permisos comprobados |
| namingPattern | string | Sala de {displayName} | Variables permitidas, longitud válida |
| defaultUserLimit | int | 0 | 0 significa sin límite |
| emptyGraceSeconds | int | 30 | 10–300 |
| allowOwnerRename | boolean | true | Rate limit y saneamiento |
| lfgJoinMode | enum direct,approval | direct | Aprobación opcional de organizador |

## Casos de aceptación escritos

### voice FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo voice.

Cuando Entrar en generador y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; comprobar y eliminar si sigue vacía.

### voice RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando El canal se reocupa justo cuando vence el job de limpieza.

Entonces El job relee ocupación y generación; conserva el canal y cancela la limpieza vieja.

### voice RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Reinicio concilia canales existentes y propietarios; no borrar una sala reocupada por un job viejo. Claim requiere ausencia del dueño según política del módulo.

### voice PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Solo dueño/staff modifica; invitado accede según permisos efectivos. El panel antiguo pierde autoridad al transferir propiedad.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.
