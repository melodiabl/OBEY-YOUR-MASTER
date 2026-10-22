# Instrucciones de trabajo para Codex u otra IA

Tu objetivo es remodelar un solo bot OBEY sobre la base entregada, con módulos mantenibles, UX consistente, recursos propios y ES/EN. Lee el plan maestro y el índice del sistema antes de editar. No empieces generando un bot nuevo ni reemplazando todo el stack.

## Primera unidad

1. Identifica rama, SHA y modificaciones locales. Concilia el bootstrap del ZIP; no resetees trabajo del usuario.
2. Revisa registro real de comandos cargados. El inventario de archivos no equivale a comandos disponibles. Asigna cada entrada a módulo y operación.
3. Confirma versiones en lockfile, runtime y Docker; fija una combinación compatible. No instales todas las dependencias de Discord.
4. Completa bienvenida como piloto usando su servicio de configuración actual, render y assets. Demuestra recorrido de punta a punta antes de extender el patrón.
5. Registra resultado y límites; migra la siguiente unidad sin declarar terminado el sistema completo.

## Reglas de implementación

Conserva Soundy y las doce IDs mp_*. Migra Shoukaku a lavalink-client con una autoridad de cola y reproducción por guild. Preserva datos, favoritos y recuperación. No añadas Kazagumo u otro gestor competidor. No ajustes reproducción mediante edición del panel.

Todas las entradas de una operación usan el mismo caso de uso y política. Presentación no escribe a DB. Mensajes se resuelven por claves; emojis por registro. Revalida actor/guild/recurso en interacciones antiguas y rutas web existentes. Usa configuración versionada, borradores y publicación segura.

Reutiliza recursos disponibles. Si falta binding real de Discord, usa fallback y documenta pendiente; nunca inventes un ID o asegures que se subió. Reemplaza referencias hardcoded por significado y consumidor, no mediante sustitución indiscriminada del contenido del usuario.

No cambies avatar, banner o landing. No reintroduzcas NSFW ni los generadores retirados. No restaures la batería de pruebas/scripts eliminada. No publiques o despliegues sin la autorización aplicable; trabajar en documentación o código local no implica que los servicios reales se hayan actualizado.

## Antes de cerrar una unidad

Explica problema, cambio, compatibilidad de datos/controles, prueba realizada, entorno y limitación. Actualiza la ficha vigente, no crees una nueva versión de cada plan. Si falta un secreto o servicio real, completa el trabajo independiente y marca la verificación conectada como pendiente.

## Cómo editar después

Texto global: catálogo. Texto del servidor: override permitido. Emoji: registro y binding. Tarjeta: renderer/plantilla. Canal/rol: configuración. Regla: policy/service. Función nueva: ficha y API pública del módulo. No repartir la misma decisión en comandos, botones, jobs y web.

## Catálogo integrado de eventos · edición 0.6

Consultar [capítulo 15](15_CATALOGO_EVENTOS.md) y la ruta única assets/obey/catalog-eventos/. Contiene 117 entradas de diseño (113 eventos y cuatro auxiliares), dos variantes y mapa de claves/consumidores. Las escenas y seis GIF están en expansion-20261020; la muestra anterior de 24 iconos de registros se retiró. Los registros y bindings actuales permanecen como autoridad hasta integrar los nuevos recursos. No confundir eventos documentados, emojis publicados y funciones implementadas.


## Conciliación de materiales 0.7

La ampliación vigente está en [16 · Estados](16_ESTADOS_Y_ANIMACIONES.md), [17 · Mapa de reemplazos](17_MAPA_REEMPLAZOS.md), [18 · ES/EN y publicación](18_I18N_Y_PUBLICACION.md) y [19 · Recetas](19_RECETAS_POR_RECORRIDO.md). Abrir también el índice único MATERIALES.md de la raíz. A01–A12 están aprobados visualmente; B/C son propuestas nuevas. Los deltas y los mapas no se cargan automáticamente por el runtime. Antes de editar un consumidor, comprobar su hash y audiencia. Conservar el registro único, la lógica de juegos, datos del usuario y las tareas de implementación pendientes.

## Alcance adicional autorizado · edición 0.8

El usuario solicitó remodelar Build tomando como referencia funcional Server Maker. Aplicar [capítulo 20](20_BUILD_Y_REMODELACION.md) y la ficha Architect vigente. La restricción general de no añadir comandos no impide implementar la entrada `/servidor` y los casos concretos de este capítulo. No extiende el permiso a funciones ajenas al alcance.

Reutilizar servicios Architect, templates, jobs, datos y ejecutor existentes. Conciliar registro de comandos/capacidades con el compilador real; no ofrecer creaciones privadas mientras envíen overwrites vacíos. IA propone blueprint validado y nunca ejecuta Discord directamente. El piloto de bienvenida sigue siendo útil; Build conecta sus bindings mediante el servicio propietario. La actualización documental no publica comandos ni acredita funciones implementadas.

## Decisión de nombres 0.9

El usuario rechaza Architect como nombre de comando. Implementar **`/servidor`**, panel **Servidor**, y acciones en lenguaje claro conforme a [nombres públicos](21_NOMBRES_CLAROS.md). `/build` deja de ser la entrada propuesta; las entradas públicas antiguas se migran al publicar de forma autorizada. Conservar servicios, claves técnicas y datos hasta poder migrarlos con evidencia. No registrar alias técnicos permanentes ni confundir cambio documental con implementación.

## Canales del soporte 0.10

Aplicar [capítulo 22](22_COMUNIDAD_Y_GITHUB.md) sin crear ni renombrar canales automáticamente. El perfil de diseño no contiene IDs reales y no debe cargarse en runtime. Completar bindings mediante selección autorizada, conciliar servicios de configuración por módulo y verificar aislamiento entre guilds. No instalar otro bot para cumplir el mapa. Separar avisos técnicos de GitHub y publicaciones públicas revisadas; no conectar ni publicar como efecto de leer documentación.

## Mensajes de los recorridos 0.11

Aplicar [contrato de mensajes](23_MENSAJES_DE_COMUNIDAD.md) para seis familias CM01–CM06, con texto ES/EN, estados, audiencias y controles. Reutilizar servicios propietarios y registro visual, sin confundir la incorporación documental con código conectado. El GitHub personalizado es condicional; el transporte nativo conserva su formato.

## Ampliación nativa autorizada 0.12

Implementar las capacidades concretas del [capítulo 24](24_CAPACIDADES_NATIVAS_DISCORD.md) con sus módulos propietarios y disponibilidad. Esto amplía el alcance de interacción de la guía anterior; no autoriza funciones arbitrarias o dominios aún diferidos. Usar matriz/recetas y revisar exports de la resolución real. No instalar todos los paquetes, mezclar payloads V2 y legacy, inventar métodos del canal o registrar comandos por leer el JSON. Corregir la discrepancia de runtime al implementar, preservando migración musical y controles Soundy.

## Cobertura verificable 0.13

Aplicar [capítulo 25](25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md) y matriz por fuente. Reemplazar descartes de voz/diffs parciales, implementar recibos y estados de datos ausentes, y validar atribución. No afirmar captura absoluta ni actor confirmado sin evidencia. Intents se amplían por consumidor autorizado; no activar archivo de contenido por habilitar metadata. Conservar esquema/destinos legacy durante conciliación y registrar límites y pruebas reales.
