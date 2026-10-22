# 18 · Idiomas y publicación de recursos

Edición 0.7. La carpeta assets/obey/ui-state-catalog/locales contiene los deltas ES/EN completos del nuevo vocabulario visual. Hay 470 hojas por idioma, con las mismas claves y variables. Son datos listos para conciliación, no catálogos ya cargados por handlers/i18n/index.js.

## Traducciones

El namespace propuesto es visual.common y visual.assets.a01…b65. El esquema usa {operationId}, compatible con el resolvedor actual. Comparar primero con locales/es.json y locales/en.json; si una clave ya existe con otro significado, conciliarla. Integrar mediante merge por namespace, sin sustituir los catálogos completos ni alterar plantillas privadas de servidores.

translation-keys.json inventaría las claves actuales de languages/ y locales/, sus hashes, variables, expresiones legacy y hojas vacías. translation-summary.json conserva conteos y diferencias ES/EN. Los conteos nuevos incluyen strings dentro de arrays, por lo que no son idénticos al conteo histórico de hojas de objetos. La paridad estructural no certifica calidad lingüística, cobertura de todos los consumidores ni que los idiomas legacy estén publicados.

El resolvedor actual carga dos catálogos y normaliza al idioma base. Mantener la decisión ES/EN inicial; revisar región, pluralización, elección de idioma del actor frente al canal público y fallback antes de anunciar más idiomas. Un éxito genérico no reemplaza el recibo o estado específico del módulo.

Los 530 candidatos de llamadas son una pista estática, no un inventario certificado de todos los textos visibles. Revisar además propiedades de objetos, funciones compartidas, templates, mensajes privados y contenido construido con variables. No traducir claves técnicas, URLs, IDs o comparadores del motor como si fueran texto de interfaz.

## Archivos que se publican

publication-plan.json contiene candidatos físicos de 128px y hashes para deduplicación. Distingue A aprobado, B/C para revisar y fuentes que no se publican. No contiene IDs inventados. Los PNG de 256px, SVG, láminas, escenas y fondos no se cargan como emojis por defecto.

1. Seleccionar materiales por consumidor y revisar variantes/contraste. No subir todo el catálogo por cantidad.
2. Conciliar claves, aliases, files, destinations y uploadPlan de assets/obey/registry.json.selected. Mantener las verificaciones por hash/nombre que ya implementa el registro.
3. Conservar y hacer copia del mapa actual de la aplicación fuera del paquete público. Consultar emojis existentes y deduplicar antes de crear.
4. Validar localmente con el script operativo existente scripts/obey-assets.js y --keys=<claves_canónicas>. El plan ui-state-catalog no es una entrada que ese script cargue automáticamente.
5. Publicar con --apply solo después de la conciliación, con la aplicación y credenciales reales del operador. El script existente obtiene ID real, guarda incrementalmente y diferencia fallo parcial.
6. Integrar el mapa obtenido con el registro actual. Comprobar nombre, hash, formato, disponibilidad, aplicación y consumidores; no confiar solo en que un ID tenga formato válido.
7. Verificar mensaje, botón, menú, DM, móvil y escritorio. Recurso inaccesible conserva texto/PNG/fallback, sin impedir la operación.
8. Retirar recursos anteriores solo al comprobar que no conservan consumidores. Conservar compatibilidad de IDs, datos y controles persistentes.

La cantidad de candidatos no acredita cupo disponible. La capacidad, permisos y comportamiento del cliente se verifican en la aplicación real antes de publicar. No se ejecutó --apply ni se usaron tokens en esta ampliación.

## Plataformas

C01–C14 usan fuentes vectoriales verificadas de la colección comunitaria Simple Icons y conservan sus fuentes/licencia. Son identidades de terceros, no dibujos propios de OBEY ni una certificación oficial de marca. Los colores son propuestas de exportación; conservar legibilidad y reconocimiento al elegir variante. C15 conserva JioSaavn de la base: su fuente nueva no se verificó y no se declara rediseñado.

Usar un indicador de carga separado; no girar o transformar el logo de una plataforma para representar una operación del bot. Conservar metadatos de procedencia y no reemplazar una identidad de plataforma por el mismo icono genérico de música.
