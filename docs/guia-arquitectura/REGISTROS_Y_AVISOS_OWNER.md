# Registros y avisos al propietario · 19/10/2026

Continuación de T38/MOD-LOGS y de la remodelación del código anterior. Los setups ya remodelados no acreditaban la sustitución de sus consumidores. El plan completo sigue abierto.

## Primera entrega local: ciclo de servidores y mensajes privados

`handlers/owner-notifications.js` es la única composición de avisos privados de entrada/salida. Se retiraron los dos listeners antiguos de `extraevents.js`. Sus mensajes mezclaban idiomas, usaban datos de propietario inexistentes después de salir y ocultaban fallos de entrega. El listener de salida también borraba configuración, economía y otros stores: esa eliminación automática se retiró. Salir del servidor no constituye una orden de borrar sus ajustes.

Los avisos incluyen servidor/ID, propietario conocido o dato ausente explícito, miembros y total actual. Usan es/en, límites de Discord y menciones desactivadas. No crean invitaciones ni ofrecen acciones destructivas nuevas. `setup-owner` permite activar/desactivar estos avisos y elegir su idioma, conservando la autorización y el escritor atómico de propietarios existentes. Los valores ausentes conservan avisos activados y español; no se modifica el archivo real durante las pruebas.

La composición distingue la carga inicial y una indisponibilidad de un alta/baja real. Mantiene el orden de transiciones, ignora duplicados durante el proceso, difiere eventos hasta que los datos estén preparados, acota pendientes a 100 y retira listeners al cerrar. Se revalida la lista de destinatarios y la preferencia después de obtener el usuario. Un propietario retirado mientras esperaba no recibe el aviso. Las entregas usan `nonce` y `enforceNonce`, según el [contrato de mensajes de Discord](https://docs.discord.com/developers/resources/message#create-message-jsonform-params); el [ciclo Gateway](https://docs.discord.com/developers/events/gateway-events#guild-create) no convierte carga inicial/indisponibilidad en una instalación nueva.

Preguntas operativas: ¿fue una transición real o carga inicial?, ¿se confirmó el envío o el DM estaba cerrado?, ¿quedó trabajo pendiente al cerrar? El registro JSON usa evento estable, entryPoint y requestId; no imprime nombres de servidores, IDs de propietarios, tokens ni errores de transporte completos. No se hacen reintentos ciegos tras una entrega incierta. La cola y la deduplicación de este incremento son locales al proceso: no se presentan como outbox durable ni garantía de entrega tras reiniciar.

16 grupos temporales verifican builders, alta/baja/duplicados/indisponibilidad, datos pendientes, preferencias, revocación durante fetch, DM cerrado, redacción, cierre y guardado aislado conservando secretos/campos ajenos. Pasan los 25 tests originales. No se envió ningún DM, no se abrió Gateway y no se simuló un alta/baja en producción.

## Registro de avance del bloque

- Avisos al propietario: implementación local y verificación de la primera entrega; despliegue pendiente.
- Registros del servidor: pendiente sustituir el consumidor, conciliar destinos/desactivación, permisos y privacidad, y verificar eventos.
- Retención/consulta/historial general y otros bloques de T38: pendientes; no se cierran por actualizar los mensajes privados.
- Plan global y el caso original de error de setup: siguen pendientes según sus evidencias; no hay aceptación real del recorrido del usuario.
