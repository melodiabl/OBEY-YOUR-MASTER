# Auditoría de consumidores de recursos

Fuente: versión 5 del ZIP, antes de esta ampliación. 1050 archivos escaneados; 11866 apariciones. El CSV/JSON es un plan de reemplazo y no una migración aplicada. Todos sus destinos propuestos resuelven a archivos existentes.

Leer ../sistema/17_MAPA_REEMPLAZOS.md. source-files.json identifica el hash de cada fuente; emoji-occurrences.json y replacements.csv describen tokens y usos estimados; asset-references.json recoge llamadas literales; dynamic-references.json requiere traza; component-calls.json incluye componentes sin emoji escrito; reviewed-findings.json conserva los nueve hallazgos revisados manualmente; translation-keys.json y translation-summary.json inventarían catálogos sin copiar sus valores.

Los módulos derivados de ruta son heurísticos. No sustituir lógica de juegos, datos del usuario o compatibilidad por una coincidencia textual. No publicar ni ejecutar nada desde estos archivos.


dynamic-resolution.json traza los 23 sitios calculados: veinte usos de claves/defaults y tres llamadas de tarjetas ajenas al registro de emojis. No interpretar la clasificación estática como ejecución verificada.
