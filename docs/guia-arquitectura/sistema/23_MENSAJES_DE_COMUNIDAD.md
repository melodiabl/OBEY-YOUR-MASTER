# Contrato de mensajes de comunidad

Edición 0.11. Los seis mensajes autorizados por el usuario están en [mensajes completos](../comunidad/MENSAJES_DE_LA_COMUNIDAD.md) y [contrato de presentación](../comunidad/mensajes.propuestos.json). Cubren CM01 configuración privada, CM02 bienvenida pública, CM03 panel de tickets, CM04 confirmación privada de reporte, CM05 aviso técnico GitHub y CM06 novedades públicas revisadas.

## Integración concreta

1. Fusionar `community.messages` de ES/EN con el catálogo runtime sin pisar claves existentes; resolver con `handlers/i18n/index.js`. Los campos dinámicos se escapan y validan según superficie; no traducir texto libre del usuario o nombres de canales automáticamente.
2. Crear/adaptar presentadores para estos seis contratos junto a los presentadores existentes; reutilizar `handlers/assets/system.js` y el registro actual. Presentación no guarda configuración ni crea tickets.
3. CM01 delega a configuración por módulo. El adaptador versionado actual solo acredita welcome; el resto exige conciliación. Mantener revisión y capacidad real por función.
4. CM02 se conecta al flujo welcome y a los enlaces elegidos del perfil soporte. CM03/CM04 delegan a `handlers/tickets/service.js` y su presentación, conciliando el propietario actual del reporte. No duplicar sistemas o almacenar reportes en mensajes sin registro.
5. CM05 queda deshabilitado con webhook nativo; habilitarlo solo al implementar el adaptador propio feeds/GitHub del capítulo 22. No reescribir la salida nativa como si ya la controlara OBEY.
6. CM06 se prepara como borrador revisable, con evidencia de despliegue y audiencia, publicación y recibo. Un canal de novedades no es permiso para emitir anuncios automáticos.

## Seguridad funcional de la presentación

Cada acción revisa permiso actual, guild, recurso, sesión y audiencia. Respuestas personales de configuración, errores, duplicados y resultados no cambian el panel de todos los miembros. Los mensajes públicos de bienvenida/panel/novedades se publican mediante configuración autorizada y recibo; no por abrir una vista previa.

Nombres de usuario, ramas, títulos PR y campos libres se tratan como texto. Limitar longitud y paginar/recortar con enlace autorizado; no permitir que contenido recibido active menciones. El payload por defecto usa `allowedMentions: { parse: [] }`; una mención individual de bienvenida requiere decisión explícita y lista de usuario autorizada. No emitir `@everyone` por texto de GitHub o de usuario.

No asignar el mismo template literal a estados diferentes: guardar, abrir ticket y publicar anuncio tienen confirmaciones propias. Estado incierto exige revisar recibo y destino, no una marca de éxito. Controles sin servicio, permiso o destino válido se ocultan o muestran indisponibilidad; nunca son botones que prometen una acción inexistente.

## Aceptación

Validar seis recorridos con ES/EN, fallback de emoji y destinos válidos/ausentes. Doble clic respeta la política de idempotencia del servicio. Una sesión vencida no opera. Un miembro no abre configuración de staff. Un ticket de A no se muestra a B. Cambiar permisos entre vista y acción vuelve a validar. Repetir un evento no duplica panel de bienvenida o ticket sin conciliación.

Verificar CM05 draft/opened y rechazo de otros eventos/firmas inválidas en el adaptador propio. Verificar CM06 sin despliegue, despliegue beta y despliegue confirmado; la publicación incierta no se reenvía ciegamente. Ningún error privado se filtra al canal público.

Esta edición valida textos, referencias y estructura documental; no ejecuta estos casos en Discord. Véase [validación de entrega](../comunidad/validacion-mensajes.json).
