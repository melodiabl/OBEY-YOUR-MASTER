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
