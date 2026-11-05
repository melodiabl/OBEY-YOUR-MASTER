# OBEY — Plan de implementación y cierre de fallos (05/11/2026)

**Rama:** feature/obey-main-implementation. **Objeto de este commit:** documentación y auditoría; NO correcciones de runtime ni despliegue. Mantener el HEAD y pruebas existentes como baseline. P0 cerrado en el checkpoint del 01/11; P1 musical activo. NyxLink 0.1.0-dev.2 es el motor actual. No reinstalar Shoukaku ni migrar a lavalink-client por seguir un plan histórico.

## Reglas no negociables del usuario

- Landing original **sin tocar**.
- Materiales Discord (emojis, GIF, iconos, personaje, banners, registry) **sin tocar**.
- Web mantiene su paleta y estructura de Next.js/React actuales hasta migración comprobada; mejorar SOLO interfaces internas.
- Nombre visible: OBEY Builder / Constructor; migrar Architect por compatibilidad con código/DB/rutas.
- API candidata Fastify+TS; Express continúa en operación hasta paridad HTTP, OAuth, sesión, CSRF, sockets, permisos y EJS retirado sin regresiones.
- No forzar cambios de dependencias, runtime, motor, nodos o servicios por razones estéticas. No tocar master ni VPS desde esta actualización documental.

## Gates con condiciones de salida

| Gate | Acciones | Qué acredita cierre |
|---|---|---|
| G0 Baseline | Estado de rama, inventario, Node/CI, versiones NyxLink/nodos y reportes de fallos sin secretos | Inventario y tests actuales preservados |
| G1 Catálogo | CAT-01..CAT-12: capacidades del nodo, búsqueda de pista, artista, álbum, Spotify, normalizadores y errores de API | Tests con respuestas reales anonimizadas y E2E de Discord/web por fuente |
| G2 Música | Voteskip real, Unshuffle, filtros con ACK, play/search, cola, autoplay y Stop | Semántica igual por prefijo/slash/botón/web; no confirmación falsa |
| G3 Operación NyxLink | Pista audible, dos guilds, cambio/reconexión de voz, 24/7, fin natural, failover real, snapshots | Evidencia con nodos reales, métricas, rollback y reporte de capacidades |
| G4 Panel musical | React cubre búsquedas, álbumes, artistas, biblioteca, cola, errores y auth; retirar player EJS al terminar | Paridad funcional/permisos, móvil y accesibilidad, no datos duplicados |
| G5 Módulos sensibles | Builder, bienvenida, tickets, logs, moderación, seguridad | E2E con dueño, moderador y usuario sin permisos en dos guilds |
| G6 Panel React | Completar secciones internas con componentes reutilizables y animación accesible | Paleta actual, landing intacta, foco, reduced motion y red lenta |
| G7 API Fastify | Ruta GET sin efectos, luego sesiones/OAuth/sockets y escrituras una por una | Paridad de cabeceras, redirects, cookies, CSRF, permisos, contratos y regresiones; retirar Express al final |
| G8 Calidad y extensión | Tests de contrato/Playwright, observabilidad, Node/deps, 32 módulos según prioridades | CI completo, rollback probado y aceptación gradual por módulo |

## Acciones inmediatas exactas

1. Capturar node info, sourceManagers, plugins y contrato de búsqueda por nodo SIN credenciales. Separar Spotify propio NyxLink (spotify.enabled=false) de Spotify servido por LavaSrc.
2. Reparar proveedor de metadata albums/artists con selección por capacidades y adaptador de formatos; eliminar catch silencioso. Mantener Spotify, Apple Music, YouTube y radio según soporte real; no introducir proveedores excluidos.
3. Reparar perfil de artista: metadatos y Top Tracks independientes; si Top Tracks no disponible, mostrar perfil y explicación, no pantalla vacía.
4. Reparar preview de álbum: URL real resuelta, listas parciales/paginadas, estados y errores específicos.
5. Conservar tests actuales de test/musiccatalog.test.js, test/discordmusiccatalog.test.js y test/musichandler-state.test.js; añadir fixtures de respuestas reales del nodo, con secrets borrados.
6. Resolver voteskip, removevoteskip, unshuffle y éxito falso de filtros; revisar 104 adaptadores en la auditoría existente sin marcar como completados.
7. Audición autorizada y pruebas del ciclo de vida con dos guilds, registros de las latencias por etapa y failover nativo NyxLink.
8. Recién después completar migración del reproductor web y los demás módulos; no mover todos los comandos de golpe.

## Modelo de arquitectura destino (responsabilidades)

BOT: Discord.js, adapters de slash/prefix/botones, módulos de dominio, NyxLink Player/Queue, mensajes con materiales actuales.

WEB: Next.js/React/TS, UI interna, servicios HTTP/Sockets, formularios, gráficos, navegación y accesibilidad, sin secretos ni SDK Discord. Mantener basePath /app y restricciones de exportación estática actuales.

API: Express vigente; Fastify+TS destino posterior con rutas y guardas verificadas, contratos Zod compartidos, servicios de dominio únicos, sesiones OAuth y Socket.IO autenticado.

COMPARTIDO: contratos versionados, políticas de acceso, errores tipados, i18n ES/EN y schemas. NO duplicar repositorios, cola o estado.

Estructura objetivo: bot/modulos/(musica,builder,tickets,moderacion,...), web/app y web/componentes, api/modulos y api/seguridad, compartido/contratos; crear archivos solo al trasladar una responsabilidad probada. En el checkout actual ya existe bot/modulos/musica y api/rutas/musica; el resto no está terminado.

## Features después de estabilizar

Message Studio (Discord Components V2 con assets actuales), Builder (diff/backup), Automation Studio (reglas declarativas y BullMQ ya presente), Tickets 2.0 (formularios y transcripción), Insights (métricas con control de privacidad). Dependencias candidatas según consumidor: motion, React Query, React Hook Form, DnD Kit, React Flow, Fastify y plugins compatibles. No afirmar que están instaladas.

## Evidencia y seguridad

Cada entrega debe incluir: SHA y archivos modificados, pruebas locales/CI, contratos antes/después, prueba de revocación de permisos, respuesta a errores, datos preservados, tiempo de búsqueda p50/p95, cambio en audio audible y plan de reversión. Test sintético, salud 200 o compilación no equivale a cierre funcional. No ejecutar pruebas destructivas ni audio en servidores ajenos; sólo guild autorizada.

**Fuentes de auditoría:** AUDITORIA-MUSICA-CATALOGO-2026-11-05.md; AUDITORIA-TRANSVERSAL-2026-11-05.md; COMPARATIVA-BOTS-2026-11-05.md; MUSIC-COMMAND-AUDIT-2026-11-05.md; NYXLINK-MIGRATION.md; PLAN-2026-11-02.md; tasks/plan.md.
