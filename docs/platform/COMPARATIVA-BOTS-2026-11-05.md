# Referencias públicas y bots cerrados — auditoría comparativa (05/11/2026)

La comparación distingue **código inspeccionable** de **funciones documentadas**. No se afirma conocer el framework, la base de datos, el proveedor musical ni la arquitectura interna de bots propietarios. Las referencias son criterios de UX/contratos, no autorización para copiar código o gráficos.

## Referencias con código abierto

| Referencia | Fuente / alcance conocido | Patrón a comparar con OBEY |
|---|---|---|
| LavaMusic (Bongo devs) | https://github.com/bongo-devs/lavamusic/blob/main/docs/architecture.md ; estudio de comandos ya realizado en MUSIC-COMMAND-AUDIT-2026-11-05.md | Separar eventos, búsquedas, cola, audio y persistencia; evitar controles que se anuncian exitosos antes de responder |
| Red-DiscordBot | https://docs.discord.red/en/stable/cog_guides/audio.html y https://github.com/Cog-Creators/Red-DiscordBot | Comandos de audio con límites y scopes; lista, autoplay, votos, colas persistentes, diagnóstico de nodos. No copiar dependencias ajenas |
| Discord-Lavalink-Music-Bot | https://github.com/tsukache/Discord-Lavalink-Music-Bot | Semántica básica de play/search/pause/skip y errores. Su código histórico no garantiza calidad actual |

La auditoría ya existente de 73 archivos / 104 adaptadores, con hashes y revisiones, está en MUSIC-COMMAND-AUDIT-2026-11-05.md. Este documento añade referencias y prioridades, no finge haber ejecutado esos repositorios en el runtime de OBEY.

## Bots cerrados con documentación pública

| Producto | Evidencia documental | Aprendizaje específico |
|---|---|---|
| Jockie Music | https://www.jockiemusic.com/faq?everyone=&permissions=&selected=setup-bots | Documenta explícitamente cuáles plataformas admiten pistas/álbumes/artistas y limita playlists Spotify a lotes de 100 con botón Load page 2. OBEY debe publicar matriz real por fuente y paginar colecciones, no prometer disponibilidad universal |
| Ticket Tool | https://ticket-tool.app/docs/dashboard/overview y https://ticket-tool.app/docs/concepts/panels | Panel y Discord comparten permisos y configuración. Búsqueda global, transcripciones, estados, formularios, asignación. No es documentación de código interno |
| Xenon | https://xenon.bot/docs | Plantillas y copias diferenciadas; permisos explícitos y recuperación. Referencia para OBEY Builder, nunca restauraciones destructivas automáticas |
| Dyno | https://docs.dyno.gg/modules/moderation | Logs, roles protegidos, permisos y dashboard modular. Referencia de flujos de moderación y seguimiento |
| Tickets (alternativa) | https://docs.tickets.bot/dashboard/introduction | Selector de servidores con acceso diferenciado y configuración por rol, útil para aislamiento multiguild |

## Matriz de brechas de OBEY

| Área | Referente | Hallazgo en OBEY | Decisión |
|---|---|---|---|
| Artista y álbum | Jockie (categorías soportadas por proveedor) | Consulta genérica que supone plugins/Top Tracks; falla sin causa específica | Prioridad P1 bloqueante; matriz de capacidades por nodo/fuente |
| Colecciones grandes | Jockie (paginación) | Preview exige colección de tracks y se cierra con error genérico | P1: paginación, límites, partial y reintento |
| Reproductor | Red, LavaMusic | Cola NyxLink ya adoptada, pero rutas legacy y aceptación real incompleta | P1: una autoridad, paridad Discord/web y pruebas reales |
| Voteskip y orden | Red | Voteskip no vota; unshuffle no restaura | P1 correcciones funcionales |
| API y dashboard | Ticket Tool / Tickets | Next estático + Express + EJS; algunas rutas han migrado | P2–P4: unificar contratos y estados sin crear doble backend |
| Builder | Xenon | Arquitectura Architect heredada con nombre público no deseado | P2: Builder / Constructor con compatibilidad |
| Moderación y logs | Dyno | Amplio inventario, aceptación funcional no equivale a comandos existentes | P2: permisos, logs, trazabilidad y E2E por capacidad |
| Datos y seguridad | Referencias anteriores | OAuth, sesión/CSRF y permisos existentes no deben perderse en Fastify | P4: paridad antes de retirar Express |
| Materiales / landing | Decisión explícita del usuario | Materiales y landing actuales se conservan | Prohibido cambiarlos en esta renovación |

## Principios para no copiar malos patrones

No conectar voz al buscar; no mezclar pistas con artistas por coincidencia de texto; no ocultar errores de proveedor; no usar endpoints de un competidor como si fueran API pública; no afirmar soporte universal Spotify solo porque aparece en la UI; no convertir documentación de producto cerrado en una lista de dependencias imaginarias.

## Evidencia requerida antes de afirmar que OBEY supera a otro bot

Pruebas grabadas de flujos de usuario con fuentes, query y nodo equivalentes; corrección funcional y límites reconocidos; p50/p95 de búsqueda y ACK bajo la misma carga; restauración y dos servidores; accesibilidad, permisos, trazabilidad de fallos y datos conservados.
