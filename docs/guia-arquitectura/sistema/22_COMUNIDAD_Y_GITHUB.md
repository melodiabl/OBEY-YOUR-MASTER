# Comunidad de soporte, canales y GitHub

Edición 0.10 · 21/10/2026, America/Asuncion. Especificación para conectar el bot con el servidor mostrado en `1001030935.mp4`. No se cambiaron canales, roles, comandos o webhooks. El video permite observar etiquetas, no verificar IDs, permisos o funcionamiento de comandos.

## 1. Dos configuraciones con alcance distinto

El servidor de soporte del proyecto tiene canales de desarrollo, anuncios, atención y operación. Cada guild cliente mantiene sus propios destinos, permisos, idioma y módulos. Un ID del soporte no es un default para las demás guilds. No enviar automáticamente logs, tickets, actividad o información de otra comunidad al soporte de OBEY.

El perfil de soporte es optativo, con guildId y rol/canal elegidos expresamente. Guardar referencias por ID real, revisión y propietario. Un cambio de nombre no rompe el vínculo. Un recurso borrado queda no disponible y solicita reasignación, sin publicar en un canal parecido. No se recrea la estructura del video durante configuración.

Consultar [mapa](../comunidad/MAPA_DE_CANALES.md) y [perfil propuesto](../comunidad/perfil-soporte.propuesto.json). Todos sus IDs quedan null y el perfil deshabilitado: no son una configuración lista para cargar.

## 2. Configuración y comandos

Dentro del recorrido de gestión `/servidor`, ofrecer selección de destinos como tarea de configuración, conectada a los servicios propietarios. Elegir módulo, canal/rol, audiencia, vista previa, validación y publicación. La implementación precisa del acceso debe conciliarse con las entradas que el proyecto realmente carga; no añadir `/soporte`, `/github` o comandos de desarrollo solo por tener categorías con esos nombres.

Los miembros usan funciones públicas habilitadas; staff gestiona moderación/configuración según permiso; desarrollo/beta no obtiene permisos administrativos por el nombre de su rol. Una restricción por canal complementa las políticas de negocio y no las reemplaza. Un canal «staff-commands» no autoriza por sí mismo una operación destructiva.

Inventario a completar durante implementación: comando cargado, alias/localización, caso de uso, módulo, roles/canales elegibles, respuesta pública/privada, estado real, prueba y evidencia. «Registrado», «disponible», «implementado» y «verificado en Discord» son estados diferentes. No afirmar que todos los comandos funcionan por tener su canal creado.

La base de `handlers/configuration-service.js` admite actualmente welcome con channelId/message. No tratar ese adaptador como configuración universal ya lista: ampliar por módulo con contrato, repositorio y validación, reutilizando sus servicios existentes. La ficha feeds actual no demuestra un proveedor GitHub implementado.

## 3. Recorridos principales

| Área | Recorrido definido | Límite |
| --- | --- | --- |
| Bienvenida | Evento de entrada → configuración publicada → mensaje/tarjeta en bienvenida | No publicar borradores ni emitir duplicados al reconectar |
| Música | Comando/botón → servicio común de cola → resultado y panel | Soundy y doce IDs se conservan; una autoridad de reproducción por guild |
| Soporte | Panel abrir-ticket → categoría seleccionada → conversación privada | No pedir tokens o archivos privados en ayuda-general |
| Reportes | Formulario → ticket/reporte con referencia → revisión del equipo | No convertir automáticamente reportes privados en issues públicos |
| Sugerencias | Propuesta → votación → decisión de staff → respuesta | No anunciar una función como terminada solo por aceptar sugerencia |
| Estado | Señal comprobada → incidente → actualizaciones → cierre revisado | OBEY apagado no puede informar su propia caída; monitor externo si se necesita esa cobertura |
| Registros | Evento real de esta guild → destino privado según tipo | Separar moderación, ticket y seguridad; respetar acceso al contenido |
| Versiones | Release/cambios → borrador de anuncio → aprobación → publicación | Un commit o merge no prueba despliegue ni disponibilidad |

Un transcript no hereda permisos de un mensaje con enlace: restringir también el archivo/destino real y sus credenciales. Audiencias propuestas del mapa deben verificarse antes de habilitar publicaciones.

## 4. Integración GitHub elegida

Primer alcance: **webhook nativo GitHub → Discord** para avisos técnicos del repositorio autorizado, enviados a dev-chat si se confirma como destino de equipo. No necesita otro bot. En Discord se crea el webhook del canal; en GitHub se configura el destino con sufijo `/github`, contenido JSON y eventos seleccionados. Fuente primaria: [Discord: introducción a webhooks](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks).

Seleccionar `push` de la rama de trabajo y `pull_request` según interés. En el transporte nativo, no prometer filtros de rama que no ofrezca el receptor: si se necesita un filtrado preciso, usar una Action acotada con secreto de destino o un receptor propio. La decisión inicial no exige ampliar backend. Guardar la URL del webhook como secreto; no incluirla en perfiles, ZIP, logs ni mensajes.

Una integración nativa publica con su formato; no presupone emojis propios, formato OBEY, deduplicación propia o moderación automática del contenido. Si el formato nativo no cumple el diseño, registrar esa diferencia y desarrollar un adaptador en el módulo feeds, nunca un segundo bot como requisito.

No habilitar simultáneamente dos transportes para los mismos eventos/destino. Desactivar una conexión no borra publicaciones antiguas. Los avisos del repositorio privado se mantienen en el alcance de equipo confirmado, sin replicarlos al canal público de changelog.

## 5. Publicación de novedades

`actualizaciones`: resumen útil para comunidad; `changelog`: detalle de una versión publicada; `roadmap`: trabajo planificado con estado; `proximas-funciones`: propuestas sin promesa de fecha. Evitar copiar el mismo mensaje a los cuatro canales.

Modelo propuesto de anuncio: versión, estado de despliegue comprobado, cambios comprensibles, módulos afectados, instrucciones si hacen falta, limitaciones y enlace autorizado. Preparar borrador con ID estable y revisión. Staff revisa contenido y destino; al confirmar, publicar y guardar ID de mensaje. Un reintento del servicio busca el recibo y concilia resultado incierto antes de repetir; no prometer entrega exactamente una vez cuando la respuesta de Discord se pierde.

Una release de GitHub puede iniciar el borrador, pero no afirmar «ya disponible» hasta comprobar el despliegue correspondiente. No publicar cuerpos de PR, logs de CI o detalles internos en la comunidad sin revisión. Inicialmente esta publicación puede ser manual; automatizar solo cuando el servicio, permisos y recuperación estén implementados.

## 6. Si se desarrolla el receptor propio después

Esto es ampliación condicional, no componente necesario para empezar. Reutilizar feeds/jobs y almacenamiento existentes. Recibir cuerpo original con tamaño limitado, validar HMAC SHA-256 y `X-Hub-Signature-256` mediante comparación segura, permitir solo repositorio/evento acordados y persistir recepción antes de responder. Fuente: [GitHub: validar entregas](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries).

Usar identidad de entrega y evento para deduplicación de entrada, más recibo por destino y contenido. El worker publica después; no bloquear la respuesta HTTP mientras Discord entrega el mensaje. Tratar errores, cola, 429 y resultado incierto. GitHub no reenvía automáticamente todas las entregas fallidas: prever conciliación o reenvío autorizado. Fuente: [GitHub: entregas fallidas](https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries).

No confundir el secreto de firma GitHub con la URL secreta de webhook Discord. El transporte nativo del apartado 4 no implica que OBEY ya valide firmas o almacene recibos de GitHub.

## 7. Materiales y textos

Usar PNG/emoji estático en panel estable, GIF solo durante tarea activa y confirmación después de efecto verificado. A12 para sincronización, A11 para confirmación; B31 bienvenida, B44 mensajes, B35 logs, B48 solicitudes y B49 servidor son propuestas según el catálogo. Plataforma GitHub conserva su identidad de plataforma. B y propuestas de plataforma mantienen revisión pendiente; no inventar IDs Discord.

No publicar paneles por cada reinicio. Conciliar mensaje guardado y editar únicamente si corresponde; si falta el mensaje, pedir o ejecutar reposición conforme a configuración autorizada. Conservar etiquetas de texto aunque el emoji esté ausente. No imponer banners o animaciones a todas las publicaciones.

Las plantillas de mensajes ES/EN del perfil quedan en [comunidad/locales](../comunidad/LEER.md). Son textos de diseño separados de los 470 textos visuales y 53 de construcción existentes; faltan fusión, conexión y prueba en contexto.

## 8. Cierre verificable

1. Inventariar IDs/roles y permisos reales sin renombrar ni crear recursos.
2. Configurar y verificar un recorrido completo de bienvenida o ticket con su servicio actual.
3. Conectar destinos adicionales por módulo y conservar el aislamiento entre guilds.
4. Habilitar webhook técnico autorizado con una entrega de prueba acordada y comprobar visibilidad.
5. Revisar anuncio público antes de publicarlo; guardar evidencia de contenido/destino y permisos.
6. Comprobar rol sin permisos, canal eliminado, emoji ausente, doble acción, reinicio, pérdida de permisos y otra guild.

Casos específicos: nadie fuera del equipo accede a avisos privados; ningún log de otra guild llega aquí; los comandos administrativos no se habilitan por cambiar de canal; un ticket no expone transcript; un webhook duplicado no se presenta como garantía de unicidad nativa; una release sin despliegue no anuncia disponibilidad; Mudae conserva su funcionamiento externo.

Esta entrega actualiza documentación y plantilla de configuración. No se instaló otro bot, no se conectó GitHub y no se publicó ningún mensaje.
