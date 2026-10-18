# Facilidad de uso de los setups

Continuación del plan del ZIP, priorizada por el usuario después del despliegue del 18/10/2026: los setups siguen siendo difíciles de entender y usar. Este trabajo corrige la interacción de los asistentes existentes; no crea comandos ni cambia su autorización o almacenamiento.

Problemas observados en el código actual: navegación por nombres de comandos sin explicar su finalidad; submenús sin orientación y sin regreso; mensajes nuevos al entrar en cada sección; formularios que muestran valores técnicos y no indican el siguiente paso; tickets comienza ofreciendo 100 sistemas; opciones técnicas compiten con las necesarias para empezar.

## Entregas y aceptación

1. Inicio comprensible: nombres y finalidad de todas las configuraciones existentes en es/en, accesos a lo habitual y categorías explicadas. Conservar filtrado de permisos, registro vivo, cooldown y paginación. Comprobar con builders reales, navegación simulada y los tests originales.
2. Formularios orientados: instrucciones por tipo, estado legible de canales/roles, avance entre ajustes y regreso por el mismo mensaje. Conservar borrador, validación, CAS, autorización fresca, cierre y límites Discord. Comprobar sesiones y formularios con interacciones controladas, incluidos permisos revocados y conflictos.
3. Inicio sencillo de bienvenida y tickets: explicar el resultado, dar una ruta básica y separar opciones avanzadas; mantener acceso a los sistemas existentes. Conservar publicación explícita y recursos actuales. Comprobar que abrir/navegar nunca guarde ni publique, y que el guardado mantenga los campos ocultos.

Cada entrega debe registrar resultado y límites antes de marcarla terminada. Las verificaciones nuevas serán temporales y se retirarán al terminar, manteniendo los tres archivos/25 tests originales. No usar datos de usuarios para comprobar la navegación. El plan de arquitectura general continúa abierto.

## Primera entrega local · navegación

El inicio ofrece bienvenida, tickets, reproductor, idioma y registros cuando están disponibles para el actor. Cada una de las 61 configuraciones prefix distintas tiene nombre y finalidad es/en; los IDs internos y nombres de comandos se conservan. Las categorías explican su contenido. 32 grupos de builders reales cubren ambos idiomas, opciones ausentes, contexto vacío y 60 entradas paginadas. La comprobación previa reprodujo la ausencia de accesos directos y las etiquetas técnicas. No se ha desplegado esta entrega.

## Segunda entrega local · un panel y pasos guiados

La entrada `!setup` mantiene el recorrido completo en el mismo mensaje: categoría, función, sección y regreso. El contexto de sesión conserva el actor/canal; cada interacción sigue reautorizándose. Volver con cambios pendientes requiere guardarlos o descartarlos primero. Los cierres por traspaso no borran los controles de la pantalla siguiente. Idioma conserva su ruta compatible y recibe el mismo regreso.

Los formularios avanzan ajuste a ajuste, muestran canales/roles como referencias de Discord, resumen los cambios por guardar y permiten retirar recursos con selectores. Se conservan modales para listas de texto y guardado/publicación explícitos. Las definiciones pueden indicar una ruta básica sin eliminar campos avanzados.

36 grupos temporales con InteractionCollector real: apertura desde el registro vivo, mismo mensaje, regreso anidado, cooldown, comando retirado, actor ajeno, permisos revocados, cambios pendientes, conflicto simulado, conservación de campos ocultos, selector de retirada, modal obsoleto y 100 ciclos sin listeners residuales. Builders reales verifican los límites de cinco filas y cinco botones en ambos idiomas. 25 tests originales, tipos y reglas de dependencias pasan. Estas comprobaciones no abren Gateway ni consultan datos o proveedores reales. El comprobador temporal se retirará al cerrar la entrega. Sin despliegue de esta revisión todavía.

## Tercera entrega local · empezar por lo básico

Bienvenida comienza con dos opciones: canal/mensaje y personalización adicional. El saludo incluye un ejemplo con las variables existentes. Tickets empieza por canal, categoría, personal y textos; los ajustes técnicos se mantienen en Más opciones. Solicitudes y menús presentan primero preguntas/opciones y después canal/publicación.

Tickets, solicitudes, menús de tickets/solicitudes/ayuda y salas temporales leen sus espacios del mismo store canónico con autorización antes y después de la consulta. Ofrecen Nuevo y entradas con configuración identificable; los 100 espacios siguen accesibles en la vista avanzada. Volver recarga el inventario y propone el siguiente espacio disponible. La selección no reserva un número ni escribe nada. Dos administradores pueden elegir el mismo número y el CAS existente resuelve el conflicto al guardar.

Los botones de publicación pueden decir su efecto concreto: publicar ayuda/reproductor, crear canal, convertir panel, eliminar canal/contenido o aplicar cuarentena. La eliminación musical conserva confirmación y botón de peligro. El adaptador slash musical reutiliza el webhook de su respuesta privada durante todo el recorrido.

La navegación agrupa seis entradas redundantes de cuatro familias que delegan en la misma operación, conservando todos los comandos y eligiendo otra entrada disponible si la preferida no está habilitada. Se revisó la finalidad real de voz, filtros de entrada y ayuda automática para evitar etiquetas equivocadas.

La comprobación temporal usa collectors y modales reales de discord.js sin Gateway, MongoDB aislado/SyncMap, conflictos reales de revisión, guardado de bienvenida y tickets, preservación de campos adicionales, recarga de espacios, 100 espacios ocupados, permiso denegado sin consulta, compatibilidad del webhook privado y 100 ciclos de limpieza. La evidencia final registra los resultados y los hashes; estos escenarios no acreditan una prueba manual con un usuario en Discord.

Datos y reversión: no se cambia ningún schema, colección o customId de los paneles publicados. No hay backfill. Revertir los commits de esta entrega devuelve los asistentes anteriores sin tocar las preferencias guardadas, el reproductor ni los tickets abiertos. Los números considerados libres no prueban que nunca hayan sido usados: la vista avanzada conserva acceso a entradas desactivadas o con ajustes parciales. La arquitectura global y la integración Epic siguen pendientes.

## Verificación final local

Implementación `3673b478678d368ee5637e6562c3b6754b402574`, sobre los incrementos `f9c4a48` y `e3e4eaa`. Pasaron 58 grupos de SDK/Mongo, 100 ciclos de limpieza, 32 grupos de navegación, 25 tests originales, tipos y reglas de dependencias (1063 módulos/3236 relaciones, cero infracciones). [Evidencia local y hashes](../platform/evidence/setup-usability-local.json). Se eliminó el comprobador temporal y el contenedor Mongo aislado, con sus volúmenes; la base de prueba se había eliminado antes. No se consultaron datos de producción para las pruebas. El estado de despliegue se registra aparte en source.json.
