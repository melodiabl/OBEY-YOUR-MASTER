# OBEY · Sistema objetivo y guía de implementación

Edición 0.15 · guía ampliada 22/10/2026, America/Asuncion · Cliente de audio decidido: `lavalink-client`.

Este es un plan de remodelación del bot completo. Las instrucciones son objetivos de implementación; no acreditan funciones implementadas. El proyecto incluido sigue siendo la base anterior y no incorpora todavía la sustitución de Shoukaku.

## Orden de lectura

| Documento | Decisión que resuelve |
| --- | --- |
| [01_ARQUITECTURA](01_ARQUITECTURA.md) | Carpetas, dependencias, runtime, composición y fronteras |
| [02_CONTRATOS](02_CONTRATOS.md) | Operaciones, estado, errores, contratos y compatibilidad |
| [03_UX_UI_DISCORD](03_UX_UI_DISCORD.md) | Navegación, mensajes, controles y estados por audiencia |
| [04_CONFIGURACION](04_CONFIGURACION.md) | Configuración por servidor, borradores y publicación |
| [05_I18N](05_I18N.md) | Catálogos, variables, plurales y selección de idioma |
| [06_RECURSOS](06_RECURSOS.md) | Imágenes, emojis, GIF, tarjetas y animaciones |
| [07_MUSICA_LAVALINK_CLIENT](07_MUSICA_LAVALINK_CLIENT.md) | Cola única, transición, autoplay, recuperación y migración |
| [08_DATOS_Y_TRABAJOS](08_DATOS_Y_TRABAJOS.md) | Persistencia, concurrencia, jobs e integración con otros bots |
| [09_OPERACION](09_OPERACION.md) | Arranque, degradación, rendimiento y diagnóstico |
| [10_EJECUCION_Y_ACEPTACION](10_EJECUCION_Y_ACEPTACION.md) | Orden, entregas y condiciones para cerrar |
| [11_INSTRUCCIONES_IA](11_INSTRUCCIONES_IA.md) | Instrucciones concretas de trabajo para otra IA |
| [12_INVENTARIO_Y_FUENTES](12_INVENTARIO_Y_FUENTES.md) | Evidencia, rutas y límites de la inspección |
| [13_ASSETS_POR_MODULO](13_ASSETS_POR_MODULO.md) | Claves ya declaradas para las 32 fichas |
| [14_MATERIALES_ADICIONALES](14_MATERIALES_ADICIONALES.md) | Tres escenas y seis GIF conservados |
| [15_CATALOGO_EVENTOS](15_CATALOGO_EVENTOS.md) | Catálogo vigente: 113 eventos y cuatro auxiliares, variantes e integración |
| [16_ESTADOS_Y_ANIMACIONES](16_ESTADOS_Y_ANIMACIONES.md) | Estados reales, recursos aprobados y controles Soundy |
| [17_MAPA_REEMPLAZOS](17_MAPA_REEMPLAZOS.md) | Inventario por archivo/línea/clave y límites de cobertura |
| [18_I18N_Y_PUBLICACION](18_I18N_Y_PUBLICACION.md) | Deltas ES/EN, reconciliación e IDs reales |
| [19_RECETAS_POR_RECORRIDO](19_RECETAS_POR_RECORRIDO.md) | Cómo conectar recursos, mensajes y servicios por módulo |
| [20_BUILD_Y_REMODELACION](20_BUILD_Y_REMODELACION.md) | Architect ampliado: construcción, remodelación y referencia Server Maker |

| [21_NOMBRES_CLAROS](21_NOMBRES_CLAROS.md) | Entrada /servidor, acciones claras y transición de comandos antiguos |

| [22_COMUNIDAD_Y_GITHUB](22_COMUNIDAD_Y_GITHUB.md) | Canales del soporte, audiencias, destinos y avisos GitHub |

| [23_MENSAJES_DE_COMUNIDAD](23_MENSAJES_DE_COMUNIDAD.md) | Seis mensajes completos, estados, botones e idiomas |

| [24_CAPACIDADES_NATIVAS_DISCORD](24_CAPACIDADES_NATIVAS_DISCORD.md) | 18 capacidades, compatibilidad, nueve recetas y adopción por módulo |

| [25_COBERTURA_DE_EVENTOS_Y_CAMBIOS](25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md) | Matrices Gateway/auditoría, siete huecos actuales y captura verificable |

| [26_INVESTIGACION_POR_CATEGORIAS](26_INVESTIGACION_POR_CATEGORIAS.md) | Investigación por categorías |
| [27_ESCALADO_SHARDS_Y_VPS](27_ESCALADO_SHARDS_Y_VPS.md) | Escalado, shards y VPS |
| [28_TOPGG_Y_PREMIUM](28_TOPGG_Y_PREMIUM.md) | Top.gg y premium |
| [29_IDIOMAS_REPOSITORIO_Y_EJECUCION](29_IDIOMAS_REPOSITORIO_Y_EJECUCION.md) | Idiomas, repositorio y ejecución |

Las fichas específicas permanecen en `../modulos/`. Se ampliaron en su misma ubicación; no hay una segunda colección de fichas. Las IDs `ARCH-*` y `MOD-*` previas se conservan. Este complemento concreta el plan maestro y prevalece sobre recomendaciones anteriores de mantener Shoukaku como destino.

## Restricciones que atraviesan la entrega

Un solo OBEY con capacidades modulares. Preservar distribución de Soundy, doce controles musicales, favoritos, datos, avatar/banner y landing. La web existente comparte operaciones y autorización. La ampliación 0.14 incluye arquitectura de checkout, premium y consulta de datos, preservando la landing; no acredita un rediseño visual o implementación web ya realizados. Usar recursos existentes revisados, no dar por aprobada cualquier propuesta antigua. No reactivar contenido retirado ni restaurar las pruebas y scripts eliminados.

ES y EN siguen como base de conciliación; la ampliación 0.14 planifica también PT-BR, FR, DE y JA, sin anunciar ninguno como completo hasta estar revisado por módulo. Árabe requiere prueba RTL. La integración con servidores organizados por otros bots reutiliza IDs elegidos por administradores; no modifica recursos ajenos de manera implícita.

## Estado real

Plan y contratos: documentados. Código de la base: conservado. Migración, nuevos recorridos y pruebas conectadas: pendientes. El ZIP es proyecto base con guía vigente para programar, no una renovación terminada ni un despliegue verificado.

El punto de entrada de materiales está en [MATERIALES.md](../../../MATERIALES.md). El catálogo nuevo no registra emojis automáticamente ni acredita implementación de eventos.


Materiales 0.15: [tanda de eventos y personaje de tickets](../materiales-20261022/LEER.md). Complementa capítulos 15–19; no reemplaza contratos de operaciones o el catálogo aprobado.
