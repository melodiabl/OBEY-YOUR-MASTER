> Entrada vigente · 01/11/2026: [README](README.md), [documentación](docs/README.md), [plan activo](tasks/plan.md) y [checkpoint](docs/platform/CHECKPOINT.md). El runtime verificado es `2355287f`; las notas del paquete 0.15 describen su entrega original. Música sigue con Shoukaku y la migración a lavalink-client permanece en P1; Next/React convive con EJS. P0 no está cerrado.

> Nota histórica del 23/10/2026 (no identifica el runtime actual): Checkout vigente: esta entrega se concilió el 23/10/2026 sobre `cea13f0`; el bot desplegado está en `7801061`, con [fachada musical y registro conciliado](docs/guia-arquitectura/modulos/music.md), conservando búsquedas, paginación y continuidad de voz, conservando las correcciones de álbumes/radio. Trinium 02 es el predeterminado; los respaldos son públicos y el privado está apagado. `ENTREGA.json` describe el paquete recibido, no certifica este checkout. Estado y siguiente etapa en [conciliación](docs/guia-arquitectura/CONCILIACION_2026-10-23.md).

# OBEY · Proyecto y guía vigentes

Edición integrada 0.15 · 22/10/2026. Un solo bot modular; destino de audio: lavalink-client.

1. Leer [plan maestro](OBEY_Plan_Maestro_Arquitectura_UX_UI.md) e [índice del sistema](docs/guia-arquitectura/sistema/00_INDICE.md).
2. Abrir [investigación ampliada](docs/guia-arquitectura/investigacion-20261022/00_LEER_PRIMERO.md): 20 bots, código, referencias visuales, shards/VPS, votos, premium, idiomas y plan de ejecución.
3. Consultar [MATERIALES.md](MATERIALES.md), la [galería del catálogo](assets/obey/ui-state-catalog/index.html) y la [galería de investigación/propuestas](docs/guia-arquitectura/investigacion-20261022/galeria.html).
4. Implementar por recorrido siguiendo [instrucciones IA](docs/guia-arquitectura/sistema/11_INSTRUCCIONES_IA.md), módulos y aceptación. /servidor es el nombre público propuesto; architect queda interno durante la migración.

Este ZIP es proyecto completo de base con guía y materiales integrados; no requiere parches ni combinar ZIPs. La base y el bootstrap previo están documentados en ENTREGA.json. El runtime de esta ampliación permanece igual: Shoukaku todavía necesita migrarse a lavalink-client. No hay nuevos emojis publicados, pagos activados o despliegues comprobados.

Conservar Soundy y doce controles, favoritos/datos, avatar/banner, landing y recursos A aprobados. B/C y NX siguen con sus estados de revisión. No reintroducir NSFW, generadores o pruebas/scripts retirados. Las capturas de terceros son referencias, no material OBEY publicable.

Capítulos 01–19: arquitectura, UX, configuración, música, idiomas, recursos, reemplazos y recorridos. 20–23: /servidor, comunidad/GitHub y mensajes. 24–25: capacidades nativas y cobertura de eventos. 26–29: investigación y crecimiento. Este es el punto de entrada actual; notas de entregas anteriores no modifican este alcance.

ES/EN son la base por conciliar. PT-BR, FR, DE y JA están planificados con textos semilla, no traducción integral. País/proveedor/precios de cobro y capacidades por VPS permanecen sin inventar; sus puertas de aceptación están en la investigación.


Materiales 0.15: [abrir la tanda nueva](docs/guia-arquitectura/materiales-20261022/LEER.md). Incluye estáticos/animaciones para miembros, voz, mensajes y roles, personaje para tickets y documentación de uso. No invalida lo aprobado ni certifica implementación.
