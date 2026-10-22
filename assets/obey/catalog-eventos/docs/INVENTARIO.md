# OBEY · Inventario de equivalentes visuales

117 entradas de diseño: cobertura de 113 tipos de registro documentados por Quark y cuatro funciones auxiliares observadas en su repositorio público. El número de tipos NO prueba que Quark tenga 113 emojis distintos. La referencia de evento es un ID de tipo de registro; no es un ID de emoji Discord.

Las etiquetas españolas describen los diseños de OBEY. Los eventos de configuración propios de Quark se reinterpretan como eventos de configuración de OBEY; no implican que las funciones estén implementadas. Un icono de token no requiere guardar ni mostrar un token real.

| Tipo de referencia | Clave propuesta OBEY | Uso | Categoría |
| --- | --- | --- | --- |
| 1 | `event.q001-member-join` | Miembro entró | Miembros |
| 2 | `event.q002-member-leave` | Miembro salió | Miembros |
| 25 | `event.q025-name-edit` | Apodo actualizado | Miembros |
| 26 | `event.q026-avatar-edit` | Avatar del servidor cambiado | Miembros |
| 44 | `event.q044-role-grant` | Rol concedido | Miembros |
| 45 | `event.q045-role-revoke` | Rol retirado | Miembros |
| 46 | `event.q046-members-delete` | Miembros depurados | Miembros |
| 57 | `event.q057-bot-add` | Bot añadido | Miembros |
| 58 | `event.q058-bot-remove` | Bot retirado | Miembros |
| 0 | `event.q000-file-delete` | Adjunto borrado | Mensajes e hilos |
| 3 | `event.q003-messages-delete` | Mensajes borrados en lote | Mensajes e hilos |
| 4 | `event.q004-thread-delete` | Mensaje de hilo borrado | Mensajes e hilos |
| 5 | `event.q005-message-delete` | Mensaje borrado | Mensajes e hilos |
| 6 | `event.q006-thread-edit` | Mensaje de hilo editado | Mensajes e hilos |
| 7 | `event.q007-message-edit` | Mensaje editado | Mensajes e hilos |
| 10 | `event.q010-thread-add` | Hilo creado | Mensajes e hilos |
| 11 | `event.q011-thread-delete` | Hilo eliminado | Mensajes e hilos |
| 34 | `event.q034-message-pin` | Mensaje fijado | Mensajes e hilos |
| 35 | `event.q035-message-unpin` | Mensaje desfijado | Mensajes e hilos |
| 51 | `event.q051-reaction-remove` | Reacción retirada | Mensajes e hilos |
| 86 | `event.q086-poll-delete` | Encuesta eliminada | Mensajes e hilos |
| 87 | `event.q087-thread-modify` | Hilo modificado | Mensajes e hilos |
| 100 | `event.q100-reaction-group-remove` | Varias reacciones retiradas | Mensajes e hilos |
| 102 | `event.q102-message-shield-block` | Mensaje bloqueado por AutoMod | Mensajes e hilos |
| 103 | `event.q103-thread-member-join` | Miembro entró al hilo | Mensajes e hilos |
| 104 | `event.q104-thread-member-leave` | Miembro salió del hilo | Mensajes e hilos |
| 105 | `event.q105-thread-members-activity` | Varios cambios de miembros del hilo | Mensajes e hilos |
| 108 | `event.q108-reaction-clear` | Reacciones vaciadas | Mensajes e hilos |
| 109 | `event.q109-thread-close` | Hilo cerrado | Mensajes e hilos |
| 110 | `event.q110-thread-open` | Hilo reabierto | Mensajes e hilos |
| 111 | `event.q111-thread-lock` | Hilo bloqueado | Mensajes e hilos |
| 112 | `event.q112-thread-unlock` | Hilo desbloqueado | Mensajes e hilos |
| 8 | `event.q008-stream-start` | Transmisión iniciada | Voz y escenarios |
| 9 | `event.q009-stream-stop` | Transmisión terminada | Voz y escenarios |
| 12 | `event.q012-camera-start` | Cámara activada | Voz y escenarios |
| 13 | `event.q013-camera-stop` | Cámara desactivada | Voz y escenarios |
| 14 | `event.q014-member-move` | Miembro movido por moderación | Voz y escenarios |
| 15 | `event.q015-speaker-move` | Cambió de canal de voz | Voz y escenarios |
| 16 | `event.q016-headphones-block` | Audio ensordecido | Voz y escenarios |
| 17 | `event.q017-speaker-join` | Entró a voz | Voz y escenarios |
| 18 | `event.q018-speaker-leave` | Salió de voz | Voz y escenarios |
| 19 | `event.q019-microphone-block` | Micrófono silenciado | Voz y escenarios |
| 20 | `event.q020-headphones-allow` | Audio habilitado | Voz y escenarios |
| 21 | `event.q021-microphone-allow` | Micrófono habilitado | Voz y escenarios |
| 22 | `event.q022-speaker-disconnect` | Desconectado de voz | Voz y escenarios |
| 54 | `event.q054-speaker-edit` | Estado de voz actualizado | Voz y escenarios |
| 59 | `event.q059-stage-start` | Escenario iniciado | Voz y escenarios |
| 60 | `event.q060-stage-stop` | Escenario terminado | Voz y escenarios |
| 61 | `event.q061-stage-edit` | Escenario actualizado | Voz y escenarios |
| 62 | `event.q062-stage-join` | Nuevo orador | Voz y escenarios |
| 63 | `event.q063-microphone-invite` | Orador invitado | Voz y escenarios |
| 64 | `event.q064-microphone-stop` | Dejó de hablar | Voz y escenarios |
| 88 | `event.q088-voice-group-activity` | Varios eventos de voz | Voz y escenarios |
| 23 | `event.q023-invite-add` | Invitación creada | Invitaciones y recursos |
| 24 | `event.q024-invite-delete` | Invitación eliminada | Invitaciones y recursos |
| 36 | `event.q036-emoji-add` | Emoji creado | Invitaciones y recursos |
| 37 | `event.q037-emoji-delete` | Emoji eliminado | Invitaciones y recursos |
| 38 | `event.q038-emoji-edit` | Emoji editado | Invitaciones y recursos |
| 65 | `event.q065-calendar-add` | Evento creado | Invitaciones y recursos |
| 66 | `event.q066-calendar-delete` | Evento eliminado | Invitaciones y recursos |
| 67 | `event.q067-calendar-edit` | Evento actualizado | Invitaciones y recursos |
| 90 | `event.q090-sticker-add` | Sticker creado | Invitaciones y recursos |
| 91 | `event.q091-sticker-delete` | Sticker eliminado | Invitaciones y recursos |
| 92 | `event.q092-sticker-edit` | Sticker editado | Invitaciones y recursos |
| 93 | `event.q093-soundboard-add` | Sonido añadido | Invitaciones y recursos |
| 94 | `event.q094-soundboard-delete` | Sonido eliminado | Invitaciones y recursos |
| 95 | `event.q095-soundboard-edit` | Sonido modificado | Invitaciones y recursos |
| 96 | `event.q096-rule-add` | Regla AutoMod creada | Invitaciones y recursos |
| 97 | `event.q097-rule-delete` | Regla AutoMod eliminada | Invitaciones y recursos |
| 98 | `event.q098-rule-edit` | Regla AutoMod modificada | Invitaciones y recursos |
| 27 | `event.q027-channel-add` | Canal creado | Canales y webhooks |
| 28 | `event.q028-channel-delete` | Canal eliminado | Canales y webhooks |
| 29 | `event.q029-channel-edit` | Canal modificado | Canales y webhooks |
| 47 | `event.q047-channel-permission-add` | Permisos de canal añadidos | Canales y webhooks |
| 48 | `event.q048-channel-permission-delete` | Permisos de canal retirados | Canales y webhooks |
| 49 | `event.q049-channel-permission-edit` | Permisos de canal cambiados | Canales y webhooks |
| 79 | `event.q079-webhook-add` | Webhook creado | Canales y webhooks |
| 80 | `event.q080-webhook-delete` | Webhook eliminado | Canales y webhooks |
| 81 | `event.q081-webhook-edit` | Webhook modificado | Canales y webhooks |
| 82 | `event.q082-webhook-avatar-edit` | Avatar del webhook cambiado | Canales y webhooks |
| 83 | `event.q083-broadcast-add` | Canal seguido | Canales y webhooks |
| 84 | `event.q084-broadcast-remove` | Canal dejado de seguir | Canales y webhooks |
| 85 | `event.q085-broadcast-edit` | Canal seguido actualizado | Canales y webhooks |
| 106 | `event.q106-channels-reorder` | Canales reordenados | Canales y webhooks |
| 30 | `event.q030-server-edit` | Servidor modificado | Servidor |
| 52 | `event.q052-server-icon-edit` | Icono del servidor cambiado | Servidor |
| 55 | `event.q055-boost-add` | Mejora del servidor añadida | Servidor |
| 56 | `event.q056-boost-remove` | Mejora del servidor retirada | Servidor |
| 107 | `event.q107-banner-edit` | Banner del servidor cambiado | Servidor |
| 31 | `event.q031-role-add` | Rol creado | Roles |
| 32 | `event.q032-role-delete` | Rol eliminado | Roles |
| 33 | `event.q033-role-edit` | Rol modificado | Roles |
| 50 | `event.q050-role-permission-edit` | Permisos de rol cambiados | Roles |
| 53 | `event.q053-role-icon-edit` | Icono del rol cambiado | Roles |
| 68 | `event.q068-log-move` | Canal de registros cambiado | Configuración y automatización |
| 69 | `event.q069-eye-edit` | Opciones de exclusión cambiadas | Configuración y automatización |
| 70 | `event.q070-language-edit` | Idioma cambiado | Configuración y automatización |
| 71 | `event.q071-key-revoke` | Token revocado | Configuración y automatización |
| 72 | `event.q072-key-add` | Token generado | Configuración y automatización |
| 73 | `event.q073-tag-delete` | Etiqueta eliminada | Configuración y automatización |
| 74 | `event.q074-tag-add` | Etiqueta añadida | Configuración y automatización |
| 75 | `event.q075-tag-edit` | Etiqueta modificada | Configuración y automatización |
| 76 | `event.q076-settings-edit` | Opciones de registros cambiadas | Configuración y automatización |
| 77 | `event.q077-log-edit` | Registro actualizado | Configuración y automatización |
| 78 | `event.q078-settings-reset` | Configuración restablecida | Configuración y automatización |
| 89 | `event.q089-subscription-edit` | Plan del servidor cambiado | Configuración y automatización |
| 99 | `event.q099-dashboard-edit` | Acceso al panel cambiado | Configuración y automatización |
| 101 | `event.q101-automation-execute` | Acción de automatización | Configuración y automatización |
| 39 | `event.q039-gavel-block` | Miembro baneado | Moderación |
| 40 | `event.q040-member-clock` | Timeout aplicado | Moderación |
| 41 | `event.q041-door-leave` | Miembro expulsado | Moderación |
| 42 | `event.q042-clock-allow` | Timeout retirado | Moderación |
| 43 | `event.q043-gavel-allow` | Ban retirado | Moderación |
| auxiliar | `ui.assistance` | Ayuda y soporte | Ayuda y estados auxiliares |
| auxiliar | `ui.billing` | Facturación | Ayuda y estados auxiliares |
| auxiliar | `ui.error` | Error | Ayuda y estados auxiliares |
| auxiliar | `ui.unexpected` | Situación inesperada | Ayuda y estados auxiliares |
