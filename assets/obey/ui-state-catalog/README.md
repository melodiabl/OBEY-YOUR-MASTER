# OBEY · Catálogo integrado de estados y materiales

Abrir index.html desde el proyecto extraído. No necesita servidor; sus imágenes usan rutas relativas dentro del ZIP. La galería tiene grupos de A aprobados, B nuevos, plataformas, eventos, base y personaje. Probar un GIF en la galería no ejecuta ninguna acción en Discord.

- approved.json: doce familias aprobadas; PNG reposo/resultado 128/256, GIF y SVG.
- extension.json: 65 familias nuevas con PNG 128/256, SVG y 16 GIF.
- platforms.json y platforms/sources/: catorce fuentes Simple Icons con atribución/licencia y variantes; JioSaavn conservado, sin fuente nueva verificada.
- character-cards.json: 23 recursos existentes del personaje, escenas, fondos y plantillas.
- capability-materials.json: recursos/estados de las 32 fichas; no crea nuevas funciones.
- integration-plan.json: conciliación propuesta con el único registro existente.
- publication-plan.json: candidatos y deduplicación; no contiene IDs inventados.
- locales/es.json y locales/en.json: 470 hojas por idioma, pendientes de merge y consumidores.
- previews/: PNG/GIF para revisar en el chat o compartir; no son emojis publicables.
- tools/: fuentes de generación de assets, independientes del runtime.

El punto de entrada general es ../../../MATERIALES.md. La guía completa está en los capítulos 16–19 de docs/guia-arquitectura/sistema. Las conexiones nuevas al código, subida real, compatibilidad operativa y migración musical siguen pendientes de ejecución por la IA que implemente.

Precedencia: A aprobado para sus usos definidos. B/C son propuestas para revisar. La base conserva bindings actuales hasta una sustitución real validada. El catálogo de eventos previo permanece. Ningún diseño nuevo reactiva contenidos retirados ni cambia avatar/banner, Soundy o landing.
