# Setups de soporte

54/63 comandos remodelados localmente: ticket, apply, menuticket, menuapply y autosupport. 100 slots paginados; ajustes mediante formulario y opciones/preguntas mediante entradas. Borrador, guardado confirmado/CAS y publicación son acciones separadas. Se conservan los custom IDs consumidos (`create_a_ticket`, `User_Apply`, `MenuSelection`), valores completos de opciones y campos legacy, incluidas cinco respuestas de solicitudes, imágenes, roles, confirmación, mensajes y categorías.

Se completa la conexión que faltaba en loaddb: apply/menuapply/menuticket/autosupport apuntan al mismo SyncMap de Guild con sus raíces ya usadas por consumidores. No se añaden colecciones ni se elimina/reemplaza contenido existente. Defaults de campos ausentes se materializan al guardar. Guardar el primer ticket incluye guildid, necesario para abrirlo.

Publicar utiliza el protocolo de recibos/nonce y el drenaje al cerrar. Repetir actualiza el mensaje confirmado; Retirar elimina solo el panel y desactiva su binding, conserva preferencias y casos abiertos. Ya no ofrece el reset antiguo que borraba la categoría de tickets. No crea/elimina canales de casos durante la configuración.

Los tickets de menú abiertos guardan un snapshot del acceso específico de su opción. Antes de editar la lista se materializa ese snapshot en registros antiguos de esa guild/slot que no lo tienen; los snapshots existentes no se reemplazan. El consumidor prefiere ese dato, tolera opciones retiradas y consulta correctamente claim.messageClaim en client.menuticket. El acceso general del personal permanece configurable. No se migra la lógica completa de atención, DM o cierre de solicitudes.

Ocho grupos temporales con Mongo propio y SDK real, transporte Discord aislado: todos los campos/formularios es/en dentro de límites; opciones/duplicados/metadata; ticket publicar/actualizar/retirar sin borrar casos; las tres clases de menús con IDs/valores exactos; snapshots antiguos al retirar opciones; solicitudes/defaults/cinco respuestas; permisos revocados; sesión SDK con borrador, bloqueo de publicación hasta Save y limpieza de listeners. Base temporal eliminada, sin red Discord ni login. Los 25 tests originales, tipos/imports de bienvenida y diff pasan. No tests/scripts permanentes, push ni despliegue.

Límites: no acredita interacción con usuarios reales, DM, permisos efectivos de categorías en producción ni disponibilidad de proveedores. Volver al código anterior no revierte mensajes o cambios ya publicados ni borra snapshots.
