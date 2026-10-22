> Actualización vigente 0.6: [catálogo de eventos](sistema/15_CATALOGO_EVENTOS.md) integrado en assets/obey/catalog-eventos/. Escenas y seis GIF se conservan. Los antiguos 24 iconos de registros se retiraron; runtime y publicación Discord siguen pendientes.

# Encargo para Codex

Trabajá sobre melodiabl/OBEY-YOUR-MASTER, rama feature/obey-main-implementation. Antes de modificar, verificá HEAD y cambios locales y comparalos con c8ba6d3ee86515813e68a028e1221d093301e91b, que es la referencia de esta guía. No reemplaces el repositorio con un ZIP ni apliques el refactor local 887bb6e automáticamente.

Leé la guía principal, matriz y plan. Reorganizá OBEY como un monolito modular preservando servicios, datos y experiencia actuales. Mantené CommonJS, Express/EJS y Mongo al principio. Reutilizá el registro de capacidades, configuración publicada, tarjetas, jobs y motor musical existentes. No añadas nuevos comandos, otro reproductor o frameworks para cumplir una estructura de carpetas.

Empezá por ARCH-01 y ARCH-02. Presentá la diferencia entre lo observado y lo propuesto, y trabajá por una capacidad completa. No te detengas en un árbol de carpetas: definí propietario, contrato, autorización, fuente de verdad y recuperación, y conectá los adaptadores existentes. Cerrá cada capacidad con evidencia antes de retirar su compatibilidad.

Preservá Soundy y sus doce IDs, favoritos actuales, reloj confirmado, control de publicaciones, avatar/banner y landing. Aplicá al panel la política sin material decorativo cuando corresponda, sin generar un catálogo nuevo. Conservá NSFW retirado y la limpieza de herramientas del handoff.

No reinstales los 122 tests y verificadores retirados. Elegí verificaciones pertinentes y proporcionadas, revisando que no accedan a proveedores reales inadvertidamente. Una prueba temporal puede apoyar una migración sin convertirse en una herramienta permanente. No ejecutes el bot, subas emojis, publiques comandos, hagas merge o despliegues como parte de una auditoría documental.

Cuando falte evidencia, marcá pendiente y continuá el trabajo independiente. No declares un módulo completo por compilar, existir un schema o pasar un test de render. Las propuestas de nuevos dominios se mantienen diferidas hasta confirmar alcance. La guía autoriza preparar el trabajo local y la documentación; no levanta el bloqueo previo de publicación remota.

Por cada entrega informá conducta cambiada, por qué, archivos, datos/migración, verificación real, límites y rollback. Mantené las tareas de esta guía sincronizadas con la rama que estés trabajando.

## Tecnologías y facilidad de edición

Antes de implementar, leer [la ampliación modular](tecnologia/00_LEER_PRIMERO.md), [el stack elegido](tecnologia/01_STACK_Y_DECISIONES.md) y [el plan de adopción](tecnologia/06_PLAN_DE_ADOPCION.md). La elección objetivo es CommonJS comprobado gradualmente con TypeScript/JSDoc, Zod para contratos nuevos y JSON Schema derivado, UI declarativa con EJS y reglas de imports con dependency-cruiser. No instalar todo ni convertir todo a TypeScript; introducir cada pieza en el incremento correspondiente y fijar versión/lockfile tras comprobar compatibilidad.

Separar edición del administrador por servidor de edición del desarrollador. Las reglas de permisos y recursos viven en el servidor; los formularios comparten descripción y contratos, sin duplicar negocio. Las rutas propuestas de src no deben presentarse como existentes. Conservar servicios actuales y adoptar el contrato de módulo sobre el registro actual.

## Latencia musical

Antes de intervenir música, leer [rendimiento y latencia](MUSICA_RENDIMIENTO_Y_LATENCIA.md). Conservar agrupación actual, reloj confirmado y límites REST; integrar la política de fondo de letras/panel antes de suponer que un buffer o endpoint quita el delay. Medir recepción/ACK/cola/nodo/edición por separado. No aplicar YAML Lavalink a NodeLink ni reactivar el privado al recibir un ejemplo documental.


## Actualización 0.7 · materiales y mapa de consumidores

La entrega incorpora las doce familias A aprobadas, la extensión B01–B65, propuestas de plataformas, galería y deltas ES/EN. Leer [índice del sistema](sistema/00_INDICE.md), en especial los capítulos 16–19, y el mapa de [reemplazos CSV](auditoria-recursos/replacements.csv). Los 32 módulos tienen referencias de materiales actualizadas. El inventario estático y los hallazgos distinguen datos, lógica y presentación. No acreditar conexiones runtime, pruebas Discord, publicación o migración musical a partir de estos archivos.

## Alcance adicional autorizado · edición 0.8

El usuario solicitó remodelar Build tomando como referencia funcional Server Maker. Aplicar [capítulo 20](sistema/20_BUILD_Y_REMODELACION.md) y la ficha Architect vigente. La restricción general de no añadir comandos no impide implementar la entrada `/servidor` y los casos concretos de este capítulo. No extiende el permiso a funciones ajenas al alcance.

Reutilizar servicios Architect, templates, jobs, datos y ejecutor existentes. Conciliar registro de comandos/capacidades con el compilador real; no ofrecer creaciones privadas mientras envíen overwrites vacíos. IA propone blueprint validado y nunca ejecuta Discord directamente. El piloto de bienvenida sigue siendo útil; Build conecta sus bindings mediante el servicio propietario. La actualización documental no publica comandos ni acredita funciones implementadas.

## Decisión de nombres 0.9

El usuario rechaza Architect como nombre de comando. Implementar **`/servidor`**, panel **Servidor**, y acciones en lenguaje claro conforme a [nombres públicos](sistema/21_NOMBRES_CLAROS.md). `/build` deja de ser la entrada propuesta; las entradas públicas antiguas se migran al publicar de forma autorizada. Conservar servicios, claves técnicas y datos hasta poder migrarlos con evidencia. No registrar alias técnicos permanentes ni confundir cambio documental con implementación.

## Mensajes de los recorridos 0.11

Aplicar [contrato de mensajes](sistema/23_MENSAJES_DE_COMUNIDAD.md) para seis familias CM01–CM06, con texto ES/EN, estados, audiencias y controles. Reutilizar servicios propietarios y registro visual, sin confundir la incorporación documental con código conectado. El GitHub personalizado es condicional; el transporte nativo conserva su formato.

## Ampliación nativa autorizada 0.12

Implementar las capacidades concretas del [capítulo 24](sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) con sus módulos propietarios y disponibilidad. Esto amplía el alcance de interacción de la guía anterior; no autoriza funciones arbitrarias o dominios aún diferidos. Usar matriz/recetas y revisar exports de la resolución real. No instalar todos los paquetes, mezclar payloads V2 y legacy, inventar métodos del canal o registrar comandos por leer el JSON. Corregir la discrepancia de runtime al implementar, preservando migración musical y controles Soundy.

## Cobertura verificable 0.13

Aplicar [capítulo 25](sistema/25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md) y matriz por fuente. Reemplazar descartes de voz/diffs parciales, implementar recibos y estados de datos ausentes, y validar atribución. No afirmar captura absoluta ni actor confirmado sin evidencia. Intents se amplían por consumidor autorizado; no activar archivo de contenido por habilitar metadata. Conservar esquema/destinos legacy durante conciliación y registrar límites y pruebas reales.
