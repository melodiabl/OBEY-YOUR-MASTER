> Actualización vigente 0.6: [catálogo de eventos](sistema/15_CATALOGO_EVENTOS.md) integrado en assets/obey/catalog-eventos/. Escenas y seis GIF se conservan. Los antiguos 24 iconos de registros se retiraron; runtime y publicación Discord siguen pendientes.

# Índice de archivos

Abrir [LEER_PRIMERO.md](LEER_PRIMERO.md), [tecnologías](tecnologia/00_LEER_PRIMERO.md) y [rendimiento musical](MUSICA_RENDIMIENTO_Y_LATENCIA.md) según el trabajo.

- [EVIDENCIA_BASE.md](EVIDENCIA_BASE.md)
- [GUIA_PARA_REORGANIZAR_OBEY.md](GUIA_PARA_REORGANIZAR_OBEY.md)
- [INSTRUCCIONES_PARA_CODEX.md](INSTRUCCIONES_PARA_CODEX.md)
- [LEER_PRIMERO.md](LEER_PRIMERO.md)
- [MATRIZ_DE_CONCILIACION.md](MATRIZ_DE_CONCILIACION.md)
- [MUSICA_RENDIMIENTO_Y_LATENCIA.md](MUSICA_RENDIMIENTO_Y_LATENCIA.md)
- [PLAN_POR_ETAPAS.md](PLAN_POR_ETAPAS.md)
- [REVISION_DOCUMENTAL.md](REVISION_DOCUMENTAL.md)
- [modulos/analytics.md](modulos/analytics.md)
- [modulos/applications.md](modulos/applications.md)
- [modulos/architect.md](modulos/architect.md)
- [modulos/automation.md](modulos/automation.md)
- [modulos/automod.md](modulos/automod.md)
- [modulos/cards.md](modulos/cards.md)
- [modulos/collections.md](modulos/collections.md)
- [modulos/decoration.md](modulos/decoration.md)
- [modulos/economy.md](modulos/economy.md)
- [modulos/events.md](modulos/events.md)
- [modulos/feeds.md](modulos/feeds.md)
- [modulos/fun.md](modulos/fun.md)
- [modulos/giveaways.md](modulos/giveaways.md)
- [modulos/levels.md](modulos/levels.md)
- [modulos/logs.md](modulos/logs.md)
- [modulos/messages.md](modulos/messages.md)
- [modulos/migrations.md](modulos/migrations.md)
- [modulos/moderation.md](modulos/moderation.md)
- [modulos/music.md](modulos/music.md)
- [modulos/profiles.md](modulos/profiles.md)
- [modulos/reminders.md](modulos/reminders.md)
- [modulos/roles.md](modulos/roles.md)
- [modulos/security.md](modulos/security.md)
- [modulos/starboard.md](modulos/starboard.md)
- [modulos/sticky.md](modulos/sticky.md)
- [modulos/suggestions.md](modulos/suggestions.md)
- [modulos/templates.md](modulos/templates.md)
- [modulos/tickets.md](modulos/tickets.md)
- [modulos/utilities.md](modulos/utilities.md)
- [modulos/verification.md](modulos/verification.md)
- [modulos/voice.md](modulos/voice.md)
- [modulos/welcome.md](modulos/welcome.md)
- [tecnologia/00_LEER_PRIMERO.md](tecnologia/00_LEER_PRIMERO.md)
- [tecnologia/01_STACK_Y_DECISIONES.md](tecnologia/01_STACK_Y_DECISIONES.md)
- [tecnologia/02_CONTRATO_DEL_MODULO.md](tecnologia/02_CONTRATO_DEL_MODULO.md)
- [tecnologia/03_CONFIGURACION_Y_PANEL.md](tecnologia/03_CONFIGURACION_Y_PANEL.md)
- [tecnologia/04_TIPOS_Y_DEPENDENCIAS.md](tecnologia/04_TIPOS_Y_DEPENDENCIAS.md)
- [tecnologia/05_COMO_EDITAR_Y_EXTENDER.md](tecnologia/05_COMO_EDITAR_Y_EXTENDER.md)
- [tecnologia/06_PLAN_DE_ADOPCION.md](tecnologia/06_PLAN_DE_ADOPCION.md)
- [tecnologia/07_FUENTES_Y_ALCANCE.md](tecnologia/07_FUENTES_Y_ALCANCE.md)
- [tecnologia/08_BASE_REAL_Y_DIFERENCIAS.md](tecnologia/08_BASE_REAL_Y_DIFERENCIAS.md)
- [tecnologia/09_OPERACION_Y_RECUPERACION.md](tecnologia/09_OPERACION_Y_RECUPERACION.md)

## Evidencia añadida durante la ejecución local

- CONCILIACION_2026-10-18.md: referencia local/remota, integridad y revisión del paquete.
- PILOTO_BIENVENIDA.md: inventario, límites, implementación, verificaciones y pendientes del primer piloto.
- FORMULARIO_BIENVENIDA.md: implementación TECH-04, traducciones, accesibilidad, revocación y evidencia de navegador.

- CICLO_DE_VIDA_BIENVENIDA.md: TECH-05 parcial, drenaje idempotente de configuración, deadline y evidencia Mongo/HTTP local.

- API_BIENVENIDA.md: entrada pública, reglas de imports/tipos en CI, OpenAPI, compatibilidad y evidencia TECH-06 parcial.

- REMODELACION_SETUPS.md: inventario de 63 comandos, alcance confirmado de código/menús, grupos, aceptación y primera navegación local.

- IDIOMA_SETUP.md: segundo setup remodelado, estados de selección/guardado/conflicto, CAS de language y evidencia Mongo/SDK.

## Actualización 0.7 · materiales y mapa de consumidores

La entrega incorpora las doce familias A aprobadas, la extensión B01–B65, propuestas de plataformas, galería y deltas ES/EN. Leer [índice del sistema](sistema/00_INDICE.md), en especial los capítulos 16–19, y el mapa de [reemplazos CSV](auditoria-recursos/replacements.csv). Los 32 módulos tienen referencias de materiales actualizadas. El inventario estático y los hallazgos distinguen datos, lógica y presentación. No acreditar conexiones runtime, pruebas Discord, publicación o migración musical a partir de estos archivos.

## Actualización 0.8 · Build / Architect

- [Build y remodelación](sistema/20_BUILD_Y_REMODELACION.md).
- [Investigación Server Maker](build/INVESTIGACION_SERVER_MAKER.md).
- [Contratos, alcance y deltas de idioma](build/LEER.md).

La ficha única de Architect se amplía. El ZIP conserva los materiales 0.7 y añade especificación de Build; no se aplican cambios runtime.

## Nombres públicos 0.9

[Capítulo 21](sistema/21_NOMBRES_CLAROS.md): `/servidor` y acciones claras sustituyen los nombres públicos anteriores. [Contrato propuesto](build/comandos-propuestos.json) para implementación y localización. Conserva las funciones y datos de la base.

## Comunidad 0.10

- [Capítulo 22](sistema/22_COMUNIDAD_Y_GITHUB.md).
- [Mapa de canales](comunidad/MAPA_DE_CANALES.md).
- [Perfil y textos de diseño](comunidad/LEER.md).

Sin IDs, secretos, registro de comandos, publicación o cambios de código.

## Mensajes de los recorridos 0.11

Aplicar [contrato de mensajes](sistema/23_MENSAJES_DE_COMUNIDAD.md) para seis familias CM01–CM06, con texto ES/EN, estados, audiencias y controles. Reutilizar servicios propietarios y registro visual, sin confundir la incorporación documental con código conectado. El GitHub personalizado es condicional; el transporte nativo conserva su formato.

## Ampliación nativa autorizada 0.12

Implementar las capacidades concretas del [capítulo 24](sistema/24_CAPACIDADES_NATIVAS_DISCORD.md) con sus módulos propietarios y disponibilidad. Esto amplía el alcance de interacción de la guía anterior; no autoriza funciones arbitrarias o dominios aún diferidos. Usar matriz/recetas y revisar exports de la resolución real. No instalar todos los paquetes, mezclar payloads V2 y legacy, inventar métodos del canal o registrar comandos por leer el JSON. Corregir la discrepancia de runtime al implementar, preservando migración musical y controles Soundy.

## Cobertura verificable 0.13

Aplicar [capítulo 25](sistema/25_COBERTURA_DE_EVENTOS_Y_CAMBIOS.md) y matriz por fuente. Reemplazar descartes de voz/diffs parciales, implementar recibos y estados de datos ausentes, y validar atribución. No afirmar captura absoluta ni actor confirmado sin evidencia. Intents se amplían por consumidor autorizado; no activar archivo de contenido por habilitar metadata. Conservar esquema/destinos legacy durante conciliación y registrar límites y pruebas reales.
