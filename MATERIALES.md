# OBEY · Materiales vigentes para implementar

Edición 0.7 · 20/10/2026, America/Asuncion. Una carpeta y un paquete de implementación.

| Material | Entrada | Estado |
| --- | --- | --- |
| Galería unificada | [Abrir catálogo](assets/obey/ui-state-catalog/index.html) | A/B/plataformas/eventos/base/personaje separados por estado |
| Doce familias aprobadas | [approved.json](assets/obey/ui-state-catalog/approved.json) | 48 PNG, 24 SVG y 12 GIF; aprobados visualmente, sin binding runtime |
| Extensión B01–B65 | [extension.json](assets/obey/ui-state-catalog/extension.json) | 130 PNG, 65 SVG y 16 GIF nuevos; pendientes de revisión visual |
| Plataformas | [platforms.json](assets/obey/ui-state-catalog/platforms.json) | 14 fuentes Simple Icons y cuatro variantes por fuente; JioSaavn conservado, fuente pendiente |
| Eventos | [Galería previa](assets/obey/catalog-eventos/index.html) | 113 eventos + cuatro auxiliares, variantes dorado/estado; conservados |
| Personaje y tarjetas | [character-cards.json](assets/obey/ui-state-catalog/character-cards.json) | 23 entradas actuales inventariadas; se conserva identidad, avatar y banner |
| Escenas y GIF previos | [Galería existente](assets/obey/expansion-20261020/index.html) | Tres escenas y seis GIF preservados; respetar precedencia aprobada para usos coincidentes |
| Reemplazos de código | [CSV](docs/guia-arquitectura/auditoria-recursos/replacements.csv) | 11866 apariciones y destino de material; no son sustituciones aplicadas |
| Módulos | [capability-materials.json](assets/obey/ui-state-catalog/capability-materials.json) | 32 fichas, recursos, estados y alcance diferido |
| ES/EN | [Español](assets/obey/ui-state-catalog/locales/es.json) / [English](assets/obey/ui-state-catalog/locales/en.json) | 470 hojas por idioma; delta para merge, no cargado automáticamente |
| Publicación | [publication-plan.json](assets/obey/ui-state-catalog/publication-plan.json) | Candidatos 128px, hashes y deduplicación; IDs reales pendientes |

## Cómo elegir el recurso

Leer [16 · Estados](docs/guia-arquitectura/sistema/16_ESTADOS_Y_ANIMACIONES.md), [17 · Cobertura](docs/guia-arquitectura/sistema/17_MAPA_REEMPLAZOS.md), [18 · Idiomas/publicación](docs/guia-arquitectura/sistema/18_I18N_Y_PUBLICACION.md) y [19 · Recetas](docs/guia-arquitectura/sistema/19_RECETAS_POR_RECORRIDO.md).

El PNG de acción es para reposo; el GIF pending dura mientras hay operación. A03 es reproducción activa y A11 confirmación posterior: no usar todos los GIF como carga. El resultado muestra el estado real y texto. No introducir demoras ni prometer un fotograma inicial sincronizado al pulsar.

Las 316 entradas de la base permanecen como recursos existentes; la aprobación de A no aprueba automáticamente la base, B o C. No reactivar contenido retirado. Los símbolos del motor de juegos, los datos y las plantillas del usuario requieren tratamiento distinto del contenido propio del bot.

No hay IDs inventados ni subidas nuevas a Discord. El catálogo de eventos no acredita funciones implementadas ni un inventario completo de emojis originales de Quark. Los logos de plataformas son identidades de terceros con procedencia documentada, no recursos originales de OBEY.

## Build / Architect · edición 0.8

El [capítulo 20](docs/guia-arquitectura/sistema/20_BUILD_Y_REMODELACION.md) especifica dónde usar A12 sincronización, A07 seguridad, A11 confirmación y las propuestas B49/B50/B52/B53/B26/B24/B23/B28/B62 en Build. Reutiliza los archivos existentes, sin nuevos uploads ni IDs inventados. B permanece pendiente de aprobación. El delta de idioma de Build se mantiene separado del delta visual hasta fusionar los catálogos runtime.

## Uso nativo Discord 0.12

[Capítulo 24](docs/guia-arquitectura/sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) incorpora el catálogo visual al registro de emojis de aplicación y a renderizadores legacy/V2 por vista. Se conservan los materiales y aprobaciones actuales. No hay nuevas imágenes ni IDs publicados. Timestamps y estado de voz se derivan de datos confirmados, no de una animación decorativa.


## Propuestas de crecimiento 0.14

[Guía NX01–NX04](docs/guia-arquitectura/investigacion-20261022/09_MATERIALES_NUEVOS.md) y [vista previa](assets/obey/growth-proposals/vista-previa.png): voto, suscripción, acceso y traspaso. Cuatro propuestas originales, 16 PNG, ocho SVG y dos GIF; sin aprobación o IDs reales. No agregadas al plan de publicación automático.

[Referencias de investigación](docs/guia-arquitectura/investigacion-20261022/03_REFERENCIAS_VISUALES.md): ocho imágenes de terceros con atribución y tipo de evidencia. No son recursos publicables del bot ni reemplazan iconos de plataforma.


## Materiales de eventos y tickets 0.15

[Guía y uso por módulo](docs/guia-arquitectura/materiales-20261022/LEER.md), [galería](docs/guia-arquitectura/materiales-20261022/galeria.html) y [ejemplos de mensajes](docs/guia-arquitectura/materiales-20261022/EJEMPLOS.md). Doce familias nuevas de variantes animadas del catálogo existente: 24 PNG, 12 SVG y 12 GIF. Una ilustración PNG nueva del personaje para tickets. Propuestas pendientes de revisión; recursos previos conservados, sin publicación de IDs ni cambios al runtime.

Corrección M05, revisión 2: micrófono silenciado con diagonal cruzada, sin círculo independiente. PNG, GIF y previsualizaciones actualizados.
