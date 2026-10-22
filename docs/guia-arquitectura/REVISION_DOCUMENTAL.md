> Actualización vigente 0.6: [catálogo de eventos](sistema/15_CATALOGO_EVENTOS.md) integrado en assets/obey/catalog-eventos/. Escenas y seis GIF se conservan. Los antiguos 24 iconos de registros se retiraron; runtime y publicación Discord siguen pendientes.

# Revisión de la documentación

La carpeta docs/guia-arquitectura contiene exclusivamente Markdown; el ZIP conjunto también contiene el proyecto.

- 51 Markdown de guía: 40 documentos base, 10 capítulos de tecnología/modularidad y una investigación de rendimiento musical.
- 32 fichas de módulos, 12 tareas transversales y 8 incrementos tecnológicos propuestos.
- 128 casos de aceptación escritos y 205 campos de diseño por conciliar, conservados.
- 251 archivos de referencia con paths y hashes de la rama base, conservados.
- Rama remota c8ba6d3 confirmada en esta revisión; paquete comparado contra su árbol sin archivos versionados faltantes.
- Código del paquete anterior conservado byte a byte; únicamente se añade o actualiza Markdown de guía y la entrada raíz.
- Tecnologías investigadas en fuentes primarias; versiones concretas e instalación pendientes de implementación.
- Enlaces locales de la guía, IDs/dependencias y CRC del ZIP revisados al empaquetar.

La revisión del paquete identifica el refactor local 887bb6e como diferencia frente a la rama, sin declararlo validado en producción. Ver [conciliación](tecnologia/08_BASE_REAL_Y_DIFERENCIAS.md).

Los casos son especificaciones, no resultados de pruebas del bot. No se ejecutaron bot, servicios reales, instalación de dependencias, registro de comandos, subida de emojis, publicación o despliegue. Las tareas ARCH, MOD y TECH no pasan a completadas por ampliar la documentación. Los ejemplos de código dentro de Markdown no son implementaciones instaladas.

La investigación musical consulta código de tres bots y documentación de Discord Player, Lavalink, NodeLink y Discord. Incluye hashes de blobs consultados, perfiles condicionales y objetivos de medición; no son benchmarks ejecutados. No se cambió código ni configuración al incorporarla.


## Actualización 0.7 · materiales y mapa de consumidores

La entrega incorpora las doce familias A aprobadas, la extensión B01–B65, propuestas de plataformas, galería y deltas ES/EN. Leer [índice del sistema](sistema/00_INDICE.md), en especial los capítulos 16–19, y el mapa de [reemplazos CSV](auditoria-recursos/replacements.csv). Los 32 módulos tienen referencias de materiales actualizadas. El inventario estático y los hallazgos distinguen datos, lógica y presentación. No acreditar conexiones runtime, pruebas Discord, publicación o migración musical a partir de estos archivos.

## Verificación de la ampliación 0.8

Revisión estática de Architect sobre el ZIP edición 0.7, versión 6. Se añade capítulo 20, investigación primaria, contrato de alcance y delta ES/EN, y se actualizan índices, instrucciones, ficha Architect y plan maestro. Se conserva el proyecto y el catálogo visual. Los hashes de los archivos consultados permiten distinguir observación del código y diseño objetivo. La verificación de esta ampliación se registra en `build/validacion.json` al empaquetar. No acredita pruebas conectadas, publicación ni código nuevo.

## Revisión 0.9

Se documenta `/servidor` como entrada pública, panel y elecciones comprensibles, localización y transición. Se sustituyen recomendaciones públicas anteriores en el capítulo 20, contrato de alcance, instrucciones y plan maestro. Se añaden capítulo 21 y contrato de nombres; se ajustan tres textos por idioma sin cambiar las 53 claves. El código, dependencias, datos y materiales binarios se conservan.

## Revisión 0.10

Se integra capítulo 22, mapa normalizado de canales observados del video, perfil exclusivo del soporte y textos ES/EN. La revisión de permisos, IDs y comandos reales permanece pendiente. Se observó que configuration-service soporta welcome y que la ficha feeds no acredita GitHub. Se documentó el webhook nativo y una ampliación condicional con referencias primarias. Código, dependencias y archivos visuales permanecen sin cambios. No se exportaron fotogramas del video ni secretos.

## Revisión 0.11

Se incorporan seis contratos de mensajes y estados, texto completo, localizaciones bajo `community.messages` y referencias a materiales existentes. Conserva claves previas, aprobación A y revisión pendiente B/C. Se verifican claves/variables, controles, rutas de recursos, enlaces y ausencia de cambios de código. Sin validación runtime ni publicación Discord.

## Revisión 0.12

Se integra capítulo 24, evidencia local con hashes, catálogo de 18 capacidades, matriz de las 32 fichas, nueve recetas y deltas ES/EN. Se contrastaron manifest/lock/Docker, cargador de comandos, despacho de interacciones, registro de assets e i18n con documentación primaria/versionada. La diferencia de engines y el alcance de listeners quedan registrados. Se conservaron código, dependencias, datos y binarios. Las verificaciones de esta entrega son documentales, no pruebas conectadas.

## Revisión 0.13

Se extraen y clasifican todas las entradas del índice Gateway y acciones del Audit Log consultados: 82 y 69. Se revisan 117 materiales y se registran siete hallazgos en la base, con hashes. La búsqueda de listeners es literal/por archivo y no acredita carga ni recepción. Los documentos fuente completos quedan fuera de la entrega. Se añaden textos ES/EN; código, dependencias y binarios se conservan. Sin pruebas conectadas ni modificación de intents.
