# Mensajes de los canales y recorridos OBEY

Edición 0.11 · 21/10/2026, America/Asuncion. El usuario autorizó incorporar los seis mensajes mostrados en el chat para configuración, bienvenida, tickets, reportes, GitHub y novedades. Son plantillas de diseño listas para conectar, no mensajes publicados ni implementación nueva del bot. Los corchetes describen controles, no texto que se deba enviar literalmente.

## CM01 · Configuración privada

**OBEY · Conectar canales**

Elegí dónde funcionará cada sistema:

**Bienvenida:** sin configurar\
**Panel de soporte:** sin configurar\
**Registros de moderación:** sin configurar\
**Avisos técnicos:** sin configurar\
**Novedades públicas:** sin configurar

Seleccioná una función para elegir su canal y revisar los permisos.

[Elegir función ▾] [Revisar configuración]

Los valores anteriores ilustran un perfil nuevo. En uso real mostrar canal actual autorizado o «Sin configurar», sin filtrar nombres de canales a actores sin acceso. Elegir función abre un selector del tipo adecuado; no asigna por nombre. Una función no implementada no abre un flujo ficticio.

Guardado confirmado: «Destino guardado para {purpose}: {channel}». Conflicto: «La configuración cambió mientras la editabas. Revisá la versión actual». Este mensaje personal no se publica en el canal de bienvenida ni en staff-commands para que otros pulsen sobre la sesión del actor.

## CM02 · Bienvenida pública

**Bienvenido a {communityName}, {displayName}**

Este es el espacio para conocer OBEY, escuchar música, compartir ideas y recibir ayuda.

Empezá por las reglas y elegí tus roles. Si necesitás una mano, encontrás al equipo en soporte.

[Leer las reglas] [Elegir roles] [Primeros pasos]

Usar solo en el perfil habilitado del soporte y para una entrada de miembro comprobada. `{displayName}` es texto escapado, no una mención arbitraria. Los botones son enlaces a canales reales de la misma guild accesibles a esa audiencia. «Elegir roles» abre el panel/canal configurado: el enlace por sí solo no asigna un rol.

Si no hay panel de roles disponible, quitar su botón y usar: «Empezá por las reglas y los primeros pasos. Si necesitás ayuda, consultá al equipo de soporte». Omitir también cualquier otro enlace no válido; no inventar URLs ni redirigir hacia un canal parecido. No depender de que todos los recién llegados reciban un mensaje privado.

## CM03 · Panel fijo de soporte

**OBEY · ¿En qué te ayudamos?**

Elegí el motivo de tu consulta. Abriremos un espacio privado para atenderte.

**Ayuda con OBEY**\
Configuración, comandos o funcionamiento.

**Reportar un error**\
Algo falló o no respondió como esperabas.

**Contactar al equipo**\
Consultas sobre el proyecto y colaboraciones.

[Elegir motivo ▾]

Seleccionar motivo produce respuesta privada «Preparando tu espacio privado…». Tras persistir y verificar privacidad: «Tu espacio de soporte está listo» y [Abrir mi ticket]. Si ya hay una solicitud conforme a la política de duplicados del servicio: «Ya tenés una solicitud abierta para este motivo. Podés continuar allí» y enlace autorizado.

El panel estable no cambia a loading para toda la comunidad cuando una persona abre un ticket. El GIF pertenece a la respuesta privada de esa operación. No anunciar éxito si falla la creación o la comprobación de privacidad. Mantener política de tickets existente al conciliar, sin añadir silenciosamente límites nuevos.

## CM04 · Confirmación privada de reporte

**Recibimos tu reporte · {reference}**

Contanos qué estabas haciendo, qué esperabas que ocurriera y qué pasó.

Si podés reproducirlo, añadí los pasos y una captura. No compartas contraseñas ni tokens.

[Ver mi reporte]

Mostrar solo después de persistir una referencia real bajo el propietario del reporte/ticket. El acceso debe pertenecer al solicitante y equipo autorizado. Si el registro existe pero el destino no está disponible: «Tu reporte quedó guardado con referencia {reference}. El acceso al espacio de atención todavía no está disponible», sin enlace roto.

Si el servicio no ha confirmado persistencia, no usar «recibimos» ni inventar una referencia. Conciliar antes de pedir reenviar. No crear un issue GitHub público con capturas o contenido del usuario de forma automática; esa integración no forma parte de la confirmación.

## CM05 · Aviso técnico GitHub personalizado

**OBEY · Cambio pendiente de revisión**

**{changeTitle}**

{author} abrió una solicitud para integrar cambios en `{branch}`.

**Repositorio:** {repository}\
**Estado:** {status}

Este aviso no confirma que los cambios estén disponibles en el bot.

[Ver cambios en GitHub]

Plantilla exclusiva del adaptador propio condicional: evento `pull_request`, acción `opened`, repositorio permitido, firma validada y destino de equipo confirmado. Estado «Borrador» si draft=true; en otro caso «Pendiente de revisión». No reutilizar «abrió» para cierre, push o merge. No copiar cuerpo completo del PR ni difundir contenido privado a la comunidad.

La opción inicial sigue siendo webhook nativo con su formato. Este documento no afirma que ese transporte use el branding o emojis OBEY. La plantilla CM05 permanece no disponible hasta implementar el adaptador propio descrito en el capítulo 22. Una configuración debe elegir transporte y evitar duplicar destinos/eventos.

## CM06 · Novedad pública revisada

**OBEY · Nueva actualización**

La versión **{version}** ya está disponible para **{scope}**.

**Novedades**\
{news}

**Correcciones**\
{fixes}

**¿Necesitás cambiar algo?**\
{instructions}

[Ver detalles] [Reportar un problema]

Publicar únicamente después de revisión editorial y evidencia del alcance real del despliegue. `{scope}` evita anunciar disponibilidad global de una prueba beta. Una release GitHub o un merge no satisfacen ese requisito. Si no se confirmó el despliegue, conservar el borrador privado.

Omitir Novedades/Correcciones si no hay contenido real para la sección. Usar «No necesitás cambiar tu configuración» solo cuando esa condición esté verificada. Enlace de detalles debe ser público y autorizado; Reportar un problema dirige al destino configurado de reportes/soporte. No enlazar repositorio privado como detalle para una audiencia que no tiene acceso.

El borrador privado ofrece [Revisar anuncio] y [Publicar anuncio], con actor/revisión/destino actuales. Durante publicación mostrar el estado solo al gestor. Confirmar con «Anuncio publicado en {channel}» después del recibo. Si la respuesta es incierta, conciliar sin anunciar éxito o repetir a ciegas.

## Idiomas, materiales y controles

[mensajes.propuestos.json](mensajes.propuestos.json) define seis contratos, estados, condiciones y referencias de materiales. Los textos viven en `locales/es.json` y `locales/en.json`, bajo `community.messages`, con `{variable}`; no están cargados todavía en el runtime. Mantener las 16 claves anteriores, los 53 textos Build y los 470 visuales; no reemplazar un catálogo por otro.

| Plantilla | Material estático previsto | Durante una acción privada | Confirmación |
| --- | --- | --- | --- |
| CM01 configuración | B51 settings | A12 sincronizar | A11 después de persistir |
| CM02 bienvenida | B31 welcome | Sin loading público | El envío registrado es el resultado |
| CM03 soporte | A01 ticket | A01 motion de esa solicitud | A11 y enlace válido |
| CM04 reporte | B19 report | A12 al guardar | A11 después de referencia durable |
| CM05 GitHub | C10 GitHub | Sin animación | Enlace y estado reales |
| CM06 novedades | B44 messages | A12 en respuesta del gestor | A11 en recibo privado |

A está aprobado visualmente; B y plataformas siguen pendientes de revisión visual. No hay IDs de emojis reales nuevos. El registro existente sigue siendo la autoridad al integrar; el contrato no lo reemplaza. Sin binding, conservar título y etiqueta de texto. No demorar el efecto para terminar el GIF ni prometer reinicio del primer frame al pulsar.

Los controles citados son propuestas de UI. Los enlaces requieren recurso/URL válido; los botones de acción resuelven una sesión opaca, actor, guild, revisión y expiración en servidor. No incluir secretos o permisos confiables en custom IDs. Las selecciones no traducen sus valores internos; se localizan sus labels. Usar el esquema real admitido por el cargador actual antes de registrar cualquier comando nuevo.
