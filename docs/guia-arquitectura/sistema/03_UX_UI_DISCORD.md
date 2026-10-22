# UX/UI del bot dentro de Discord

## Jerarquía de experiencia

La ayuda se organiza por tareas: escuchar, configurar, atender, moderar, participar y consultar. Un miembro ve funciones disponibles; un gestor puede llegar a configuración desde la función. Las operaciones de propietario de OBEY permanecen fuera de los menús públicos.

Flujo público: contexto breve → información principal → acción útil → resultado. Flujo de configuración: resumen actual → editar sección → borrador → vista previa → publicar. Volver conserva el borrador. Cancelar explica si descarta cambios o solo cierra la vista.

## Catálogo de vistas objetivo

| Vista | Contenido | Acciones | Audiencia |
| --- | --- | --- | --- |
| Inicio/ayuda | Objetivos, funciones habilitadas, ejemplo | Elegir área, buscar, configurar | Miembro; configuración solo gestor |
| Resumen de módulo | Estado, requisitos y destino | Configurar, probar, diagnosticar | Gestor |
| Editor | Campo, valor heredado, error localizado | Guardar borrador, restaurar campo, volver | Gestor |
| Vista previa | Ejemplo identificado y datos de prueba | Editar, publicar, cancelar | Gestor |
| Confirmación | Efecto, alcance y recurso exactos | Confirmar, cancelar | Actor elegible |
| Lista | Contexto, página, filas resumidas | Seleccionar, anterior, siguiente | Según dominio |
| Ficha | Estado y datos del recurso | Acciones válidas en ese estado | Según recurso |
| Diagnóstico | Requisito afectado y reparación posible | Reintentar comprobación, cambiar destino | Gestor/operador |

Configuración y ayuda nuevas se ofrecen primero como recorridos, no como nombres de comandos inventados. Conciliar registro slash, prefijos y límites antes de elegir nombres finales o añadir nuevas raíces.

## Contrato visual común

Cada vista define título, resumen, hechos principales, acciones principales/secundarias, audiencia y estados. Una sola acción principal por decisión. Evitar párrafos enormes, líneas de decoración y alfabetos Unicode estilizados. Iconos no sustituyen etiquetas ambiguas. Estado activo, error y permiso no dependen solo de color o animación.

La dirección existente es personaje + navy/dorado con acentos cian. Reutilizar tokens efectivos del proyecto; cualquier valor nuevo requiere contraste y revisión en móvil y escritorio. Los colores de botones nativos son los estilos admitidos por Discord: el tema no implica botón dorado personalizado. Las tipografías propias se aplican a tarjetas, no a controles nativos.

## Estados y mensajes de ejemplo propuestos

| Estado | Mensaje de diseño | Acción |
| --- | --- | --- |
| Sin configurar | Elegí un canal para activar las bienvenidas. | Elegir canal |
| Procesando | Estoy preparando la vista previa. | Esperar; impedir doble envío |
| Vacío | Todavía no hay canciones en la cola. | Buscar canción |
| Permiso | Necesito Enviar mensajes en el canal elegido. | Cambiar destino o comprobar permisos |
| Conflicto | Esta configuración cambió mientras la editabas. | Revisar versión actual |
| Parcial | Cerré el ticket; la transcripción sigue pendiente. | Consultar estado |
| Desconocido | No pude confirmar el resultado. Referencia: … | Comprobar, sin repetir a ciegas |
| Caducado | Esta selección venció. Abrí una búsqueda nueva. | Nueva búsqueda |

Son textos de producto a integrar en claves; no respuestas ya conectadas al runtime.

## Música y mensajes privados

Conservar la disposición de Soundy y sus doce controles. Separar barra/estado público de búsqueda, cola paginada, letras, favoritos y ajustes personales. Abrir un listado privado no cambia el reproductor público ni el idioma compartido. Explicar cuándo una selección encola, reproduce o reemplaza; evitar que el mismo icono haga acciones distintas sin etiqueta/estado.

Las confirmaciones de gustos son privadas; el servidor no ve historial personal. Evitar DM automático por una acción cotidiana: preferir efímero dentro de la interacción. Si una función requiere DM y está bloqueado, responder con alternativa en el origen autorizado sin publicar contenido privado.

## Components V2

Elegir formato por familia de mensaje y conservar compatibilidad legacy. El flag V2 cambia el modelo del mensaje y no debe activarse para combinar payloads tradicionales incompatibles. Consultar [referencia oficial](https://docs.discord.com/developers/components/reference) y validar builders de la versión instalada. No anunciar selección de fuente, CSS, hover personalizado o animación al pulsar como capacidades de botones nativos.

## Revisión visual requerida al implementar

Capturar móvil y escritorio con idioma largo, nombres largos, recursos ausentes, sin permiso, lista vacía y sesión vencida. Verificar lectura, orden, etiquetas, tamaño real del emoji y ausencia de texto técnico. No considerar una imagen generada como prueba del render en Discord.

## Catálogo integrado de eventos · edición 0.6

Consultar [capítulo 15](15_CATALOGO_EVENTOS.md) y la ruta única assets/obey/catalog-eventos/. Contiene 117 entradas de diseño (113 eventos y cuatro auxiliares), dos variantes y mapa de claves/consumidores. Las escenas y seis GIF están en expansion-20261020; la muestra anterior de 24 iconos de registros se retiró. Los registros y bindings actuales permanecen como autoridad hasta integrar los nuevos recursos. No confundir eventos documentados, emojis publicados y funciones implementadas.


## Conciliación de materiales 0.7

La ampliación vigente está en [16 · Estados](16_ESTADOS_Y_ANIMACIONES.md), [17 · Mapa de reemplazos](17_MAPA_REEMPLAZOS.md), [18 · ES/EN y publicación](18_I18N_Y_PUBLICACION.md) y [19 · Recetas](19_RECETAS_POR_RECORRIDO.md). Abrir también el índice único MATERIALES.md de la raíz. A01–A12 están aprobados visualmente; B/C son propuestas nuevas. Los deltas y los mapas no se cargan automáticamente por el runtime. Antes de editar un consumidor, comprobar su hash y audiencia. Conservar el registro único, la lógica de juegos, datos del usuario y las tareas de implementación pendientes.
