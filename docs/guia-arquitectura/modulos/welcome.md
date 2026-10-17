# Guía de migración del módulo welcome

Tarea `MOD-WELCOME`. Estado `configuration_pilot_local; full_module_pending`. Destino propuesto `src/modules/welcome`. La migración preserva funciones y datos existentes; la ficha no autoriza agregar funciones nuevas.


Dependencias de arquitectura: `ARCH-03`, `ARCH-05`, `ARCH-07`.

- [ ] Inventario y consumidores conciliados
- [ ] Propietario contratos y persistencia definidos
- [ ] Adaptadores existentes conectados sin duplicación
- [ ] Datos y compatibilidad preservados
- [ ] Verificación y rollback documentados

Estas casillas son trabajo pendiente; no se marcan por recibir esta ficha.

## Evidencia en la rama

- `dashboard/welcome-routes.js`
- `handlers/configuration-service.js`
- `handlers/configuration.js`
- `handlers/leave.js`
- `handlers/welcome-access.js`
- `handlers/welcome-configuration.js`
- `handlers/welcome-message.js`
- `handlers/welcome.js`

La presencia de estas rutas no acredita el recorrido completo; conciliar operaciones, consumidores y datos.

## Recorrido objetivo y permisos

Gestor configura; miembro del evento es destinatario.

1. Elegir destino de entrada y salida por separado.
2. editar texto y tarjeta.
3. revisar variables.
4. preview sintético.
5. publicar configuración.
6. procesar ingreso una sola vez.

## Fuente de verdad y límites

WelcomeConfig revisionada; preservar aliases y mensajes ya guardados

Preview solo gestores; público según canal elegido; DM únicamente al miembro destinatario y cuando esté habilitado.

Fallo de imagen permite texto legible según política; fallo DM se registra aparte. Reingreso es otra sesión; verificación puede posponer la bienvenida.

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
| joinChannelId | snowflake nullable | null | Debe pertenecer al servidor y permitir envío |
| leaveChannelId | snowflake nullable | null | Destino independiente |
| dmEnabled | boolean | false | DM fallido no anula bienvenida pública |
| messageTemplateId | referencia | plantilla base | Variables permitidas por evento |
| cardTemplateId | referencia nullable | null | Render separado del texto |
| mentionMember | boolean | true | Solo el miembro del evento; nunca everyone por sustitución |
| deliveryMoment | enum | after_verification si activa; on_join en otro caso | Una bienvenida por sesión de ingreso |

## Casos de aceptación escritos

### welcome FLOW

Dado Configuración válida, recursos disponibles y actor elegible del módulo welcome.

Cuando Elegir destino de entrada y salida por separado y completar el recorrido aprobado.

Entonces Cada paso avanza solo tras validar permisos y resultado; procesar ingreso una sola vez.

### welcome RACE

Dado Dos operaciones compiten sobre la misma entidad y revisión.

Cuando El mismo ingreso llega dos veces antes de completar verificación.

Entonces Una sola bienvenida se entrega para esa sesión cuando sea elegible.

### welcome RECOVERY

Dado Una operación quedó pendiente o parcialmente aplicada.

Cuando Reiniciar o reintentar antes de enviar confirmación de éxito.

Entonces Fallo de imagen permite texto legible según política; fallo DM se registra aparte. Reingreso es otra sesión; verificación puede posponer la bienvenida.

### welcome PRIVACY

Dado Actor pierde permiso o consulta desde otra guild/audiencia.

Cuando Abrir detalle, componente, archivo o socket ya emitido.

Entonces Denegar la nueva entrega sin filtrar datos. Preview solo gestores; público según canal elegido; DM únicamente al miembro destinatario y cuando esté habilitado.

## Cierre y evidencia

Registrar entrada canónica, permisos, datos, efectos, revisión, traducciones, material y rollback. Comparar cada superficie ofrecida y explicar funciones exclusivas. Los casos anteriores son especificaciones, no pruebas ejecutadas. Un módulo sin dominio confirmado queda pendiente de alcance, sin carpetas de relleno.

## Incremento local · 18/10/2026

Canal y mensaje pasan por el servicio autorizado del [piloto](../PILOTO_BIENVENIDA.md), commit `3d63780c30da9fab6546d899af21fc2c072d3016`. Datos y aliases existentes, borrador, CAS y último recibo conservados. Las casillas de esta ficha abarcan todo welcome y permanecen abiertas: no se han migrado tarjetas/DM, segundo canal, concesiones de roles, captcha, entrega/deduplicación ni despedidas. La evidencia distingue Mongo/HTTP aislados de Discord/OAuth reales pendientes.
