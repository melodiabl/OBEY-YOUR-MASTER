# Entradas · formularios de automatización

Entrega local de customcommand, keyword y autodelete. Acumulado 37/63; conserva stores, paths, aliases y formatos del consumidor. No despliegue ni borrado/envío real de mensajes.

Un menú paginado permite crear, seleccionar, editar o quitar entradas y Guardar/Descartar/Cerrar. Formularios nativos de hasta cinco campos sustituyen collectors de mensajes y reacciones. Nombre, respuesta y embed; palabras clave añaden canales y alias. Se conserva el campo efectivo `embed`, junto a metadatos antiguos desconocidos. Canal/alias vacío conserva valores al editar; `-` vacía explícitamente. Una lista antigua que exceda el formulario no se trunca al guardarse: se presenta vacía con esa indicación. Nuevos comandos no pueden ocultar un comando/alias nativo; nombres duplicados se rechazan.

Autodelete conserva `{id,delay}` y acepta 3–3600 segundos, almacenados como milisegundos. Canal del servidor y ManageMessages del bot se comprueban al editar y guardar. Palabras clave comprueban sus canales. La eliminación solo es borrador hasta Guardar.

CAS/cola compartidos: ante conflicto entre paneles, el borrador sigue visible pero Guardar queda bloqueado. Descartar y recargar obtiene entradas actuales antes de continuar. Así un segundo Guardar no sustituye silenciosamente otras entradas creadas por el otro panel. Formularios obsoletos se rechazan al cambiar de selección/página; permisos se revalidan y caducar cierra collectors.

Ocho grupos temporales con Mongo y SDK: builders/formularios, editar/quitar preservando datos, nombres duplicados/reservados, cinco campos de palabras clave, listas antiguas grandes, rangos/autodelete, conflicto bloqueado y paginación/formulario obsoleto/permisos revocados. Bases propias eliminadas y cero rechazos no manejados. Checks originales/imports/diff antes del commit; no tests/scripts permanentes añadidos. No valida cliente Discord/Gateway ni jobs reales.
