# 17 · Mapa de reemplazos y cobertura estática

Edición 0.7. Fuente: ZIP de implementación versión 5, antes de integrar esta ampliación. Rama remota consultada: feature/obey-main-implementation, c8ba6d3ee86515813e68a028e1221d093301e91b. El bootstrap local incluido sigue documentado por la entrega base. El checkout local de trabajo tiene otros cambios y no se mezcló con este paquete.

## Evidencia producida

| Métrica | Conteo |
| --- | --- |
| Archivos fuente/catálogos examinados | 1050 |
| Apariciones de emojis, markup/CDN e IDs legacy conocidos | 11866 |
| Referencias literales a claves de assets | 1030 |
| Referencias de assets calculadas | 23 |
| Llamadas de componentes inventariadas | 676 |
| Candidatos estáticos de localización en llamadas | 530 |
| Errores de parseo JS del alcance | 0 |

Los conteos incluyen repeticiones en idiomas y datos; no representan cambios necesarios ni funciones implementadas. El inventario estático es exhaustivo para las rutas/extensiones incluidas; la revisión semántica manual se limita a los nueve hallazgos y siete archivos indicados en reviewed-findings.json. No se afirma lectura humana línea por línea de los 1050 archivos.

Se incluyeron comandos, slashCommands, handlers, events, tasks, workers, bootstrap, languages, locales, dashboard (incluido public), image-service sin binarios/assets, botconfig no privado, database, social_log, scripts y JS raíz. Se excluyeron dependencias, Git, cachés, binarios, pruebas, documentación como código consumidor y el archivo de credenciales botconfig/config.json. Los JSON de assets se verifican como registros aparte. El esquema detecta Unicode RGI, markup, CDN y bare IDs conocidos; los IDs calculados o desconocidos requieren traza de componente y no se declaran cubiertos por coincidencia textual.

## Cómo usar la matriz

Abrir ../auditoria-recursos/replacements.csv. Cada fila incluye archivo, línea, columna, token/ID original, clave canónica, superficie estimada, adaptador presente, material A/B/base, PNG/GIF, siguiente acción y hash del archivo fuente. Todos los destinos propuestos de las filas resuelven a un archivo existente en esta entrega. Ninguna fila acredita una sustitución aplicada al runtime.

| Clasificación | Apariciones |
| --- | --- |
| resolver-or-compatibility-table | 117 |
| adapter-present-review-semantics | 1356 |
| literal-map-candidate | 9857 |
| logic-or-protocol-review | 443 |
| game-state-or-presentation-review | 64 |
| comment-no-replacement | 29 |

1. Comprobar primero el hash; si cambió el archivo, releer su consumidor.
2. Preservar comentarios, compatibilidad, comparaciones de juegos y datos del usuario.
3. Si ya existe un adaptador, conciliar su recurso; no envolver repetidamente el texto ni crear un resolvedor competidor.
4. Si es texto propio de OBEY, separar traducción y representación. Mantener interpolaciones, plurales y contenido dinámico.
5. Si es un label, usar texto plano y setEmoji por separado cuando corresponda.
6. Verificar consumidores prefix/slash/interactivos y audiencia privada, no solo el panel musical principal.

asset-references.json, component-calls.json y dynamic-references.json permiten trazar las referencias que no contienen un emoji literal. Las asignaciones automáticas de módulo son heurísticas por ruta y no sustituyen el contrato público de la capacidad.

## Hallazgos revisados

Los nueve hallazgos exactos están en ../auditoria-recursos/reviewed-findings.json. Destacan searchui frente a playui, objetos de emoji interpolados como texto, sourceIcon genérico, IDs m2_ heredados, textos musicales aún escritos en español y ausencia de un pending-state común en los controles. Su corrección requiere trazado y cambio de consumidores; aquí se documentan y proporcionan materiales.

No sustituir símbolos del motor de juegos ni modificar plantillas del usuario con un reemplazo global. No borrar IDs legacy necesarios para interpretar compatibilidad mientras existan consumidores. Los 122 bare IDs conocidos detectados no son nuevas publicaciones.


## Traza de las 23 referencias calculadas

Se añadió ../auditoria-recursos/dynamic-resolution.json con una traza por sitio y claves posibles. Veinte sitios se acotan a tablas, condicionales o llamadas internas; tres llamadas image(guildId, assetId) pertenecen a imágenes administradas de tarjetas y no son referencias a emojis. Los overrides de sugerencias por servidor se preservan. No quedan sitios sin clasificar dentro de esas 23 detecciones, aunque su ejecución y configuración real siguen requiriendo verificación. El uso de image como nombre de método no demuestra que sea un recurso del registro de emojis.
