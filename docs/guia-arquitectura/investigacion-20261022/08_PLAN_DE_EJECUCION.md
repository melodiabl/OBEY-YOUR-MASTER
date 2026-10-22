# Plan ejecutable para la remodelación

Esta ampliación autoriza especificar nuevos alcances solicitados (multi-VPS, votos, premium, idiomas y colecciones), sin activar automáticamente funciones de negocio. Las fichas MOD-* existentes conservan rutas y datos. Su restricción previa de «no añadir funciones» se entiende ahora como no introducirlas sin contrato/etapa; las propuestas nuevas de este capítulo sí forman parte de la planificación pedida.

## Prioridades con puertas de salida

| Etapa | Entrega | Evidencia para cerrar |
| --- | --- | --- |
| P0 | Conciliar base y runtime; inventario de comandos y rutas | SHA, instalación limpia y discrepancias resueltas |
| P1 | Música consistente con lavalink-client | fin/skip/stop/error/modos/cola manual/autoplay y recuperación |
| P2 | Configuración, bienvenida, tickets y moderación/logs | recorridos completos en dos guilds y permisos distintos |
| P3 | Reemplazo de recursos y localización por capacidad | resolver IDs reales, fallback y capturas por idioma |
| P4 | Votos y derechos premium sin venta pública | sandbox, dedupe, conciliación y reglas de acceso |
| P5 | Despliegue escalable y recuperación | drain/takeover con proceso caído y datos restaurados |
| P6 | Ampliaciones de comunidad, colecciones y automatización | contrato, cuotas, datos/licencias y aceptación por módulo |

No retrasar la reparación de autoplay hasta terminar el sistema comercial. Tampoco anunciar premium antes de resolver país/proveedor, costes y políticas reales. P3 se ejecuta junto con cada recorrido, no como reemplazo global final.

## Cada módulo y lo que debe demostrar

| Módulo | Referencia | Recorrido | Aceptación esencial | Material existente |
| --- | --- | --- | --- | --- |
| music | Red, JMusicBot, Rythm | cola, fin, modos, autoplay | fin natural pasa una vez; stop invalida recomendación tardía | A03,A04,A05,A06 |
| tickets | Ticket Tool, Tickets Bot | abrir, claim, cierre, transcripción | doble clic no crea dos tickets; privado al usuario/equipo | A01,B13–B17 |
| logs | Quark, Dyno | captura, diff, entrega | cambio simultáneo no pierde campos; actor ausente visible | catálogo-eventos |
| moderation | YAGPDB, Wick | sanción, caso, notificación | jerarquía revalidada; fallo DM no duplica sanción | A07,B34 |
| automod | Wick, YAGPDB | reglas, ejecución y explicación | no sancionar dos veces por el mismo hecho/regla | A07,B24 |
| security | Wick | observación, incidente, recuperación | contención opt-in; rollback solo de cambios propios confirmados | A07,B26 |
| welcome | ProBot, Mimu | configurar, preview, prueba, envío | DM cerrado no impide bienvenida configurada al canal | B31,A10 |
| cards | Arcane, ProBot | render de datos y exports | nombre largo/multilenguaje no desborda; worker acotado | A10 |
| levels | Arcane, ProBot | XP, rango, recompensas | cooldown/exclusiones/roles explicados; no premiar dos veces | B36,B37 |
| roles | YAGPDB, Carl-bot | panel, concesión y retirada | no quitar concesiones de otro origen; jerarquía válida | B33 |
| collections | Pokétwo, Mudae parcial | inventario, búsqueda e intercambio | ambas partes confirman revisión actual; sin duplicar activos | B37,B40 |
| economy | Mimu, Pokétwo | saldo, ledger, tienda | saldo/stock consistentes con compra repetida | B38,B39 |
| giveaways | GiveawayBot | crear, participar, finalizar, reroll | cierre y premio idempotentes; elegibilidad documentada | B41 |
| architect | Server Maker | /servidor, diff y aplicación | preview no modifica; recibo por paso y cambios autorizados | B49,B50 |
| applications | Ticket Tool, Tickets Bot | formulario, revisión y decisión | aprobar/denegar una vez; privacidad del candidato | B48 |
| profiles | Rythm, Arcane, Mudae parcial | vista Discord/web autorizada | separar datos públicos, gustos privados y roles | B37,A02 |
| feeds | YAGPDB, Sapphire general | suscribir, recibir, deduplicar | reintento no repite aviso; fallo de proveedor visible | B46 |
| messages | Mimu, MEE6 | plantilla, variables, audiencia | escape y menciones seguras; sin placeholders crudos | B44 |
| verification | Wick | reglas, comprobación, acceso | accesibilidad/fallo recuperable; no pedir QR de login | A07,B26 |
| suggestions | Carl-bot general | proponer, votar, decidir | decisión staff autorizada; voto propio sin duplicar | B42 |
| utilities | Arcane, GiveawayBot | ayuda, contexto, diagnóstico | ayuda lista solo capacidades habilitadas y entradas reales | B65 |
| templates | Server Maker | guardar, previsualizar y aplicar | template no transporta secretos o IDs ajenos como propios | B50 |
| migrations | Propuesta OBEY | migrar, checkpoint, conciliar | reiniciar no duplica efectos; origen se conserva hasta aceptar | A12 |
| automation | Propuesta OBEY | trigger, condición, acción | sin bucle de eventos propios; presupuesto de ejecución | B45 |
| analytics | Propuesta OBEY | consulta y agregación por guild | conteos parciales identificados; sin fuga entre tenants | B47 |
| events | Capacidad nativa Discord | programar, asistir, recordar | evento y permiso resueltos; recordatorio no duplicado | B58 |
| voice | Capacidad nativa Discord | estado y canales temporales | no grabar audio; no borrar canal ajeno u ocupado por error | B55 |
| reminders | Propuesta OBEY | programar, listar, cancelar | hora/zona correctas; sin entrega tras cancelación confirmada | B43 |
| starboard | ProBot, propuesta OBEY | destacar mensaje elegible | revisión de permisos y eliminación en origen | B58 |
| sticky | Propuesta OBEY | mensaje persistente por canal | coalescing y rate limits; no repost infinito propio | B44 |
| decoration | Propuesta OBEY | preferencias de apariencia | no cambiar datos o permisos al elegir tema | A10 |
| fun | Alcance conservado | comandos permitidos existentes | no recuperar NSFW o generadores retirados | B40 |

## Contrato para todos los comandos

El inventario comandos-base.csv incluye archivos de commands/ y slashCommands/, con hash y metadatos literales recuperables. Es inventario estático de archivos candidatos, no lista de comandos registrados ni prueba de funcionamiento. Resolución dinámica, alias, subcomandos agrupados y botones requieren seguir el loader y el registro en memoria en staging. No marcar «funciona» por detectar execute/run.

Por cada operación activa completar: ID canónico, categoría, entradas slash/prefix/botón/contexto/web, scopes, actor, permisos actuales, parámetros, confirmación, resultado/error, cooldown, idempotencia, persistencia, efectos, claves i18n, material, recuperación y evidencia. Entradas con la misma intención comparten operación; diferencias intencionales se documentan. Controles musicales mantienen los doce IDs mp_*.

## Casos de música que bloquean entrega

Fin natural con cola manual; repeat-track; repeat-queue; shuffle; autoplay sin cola, con candidato y sin candidato; pista no disponible; error/stuck; reconexión; doble skip; stop mientras busca; pause/seek durante transición; favoritos conservados; selector caducado; DM bloqueado; pérdida de permisos y botón de mensaje antiguo. Cada transición usa playbackInstanceId/revision/generation; un resultado tardío se descarta si ya cambió la sesión.

Autoplay propuesto: candidatos de señales consentidas (sesión, artistas, likes y feedback propio), resolver disponibilidad, quitar recientes/duplicados, diversidad controlada y explicación basada en señal registrada. Inicio sin historial usa semillas de sesión; fallar no inventa una recomendación. Precargar solo una búsqueda acotada; cancelar por stop/nueva cola manual; no iniciar otra pista por una animación o por editar un embed. No asumir acceso al historial o likes de Spotify por conocer el nombre del usuario.

## Recibo de aceptación

Cada caso registra build/commit, guild de prueba, configuración, operación, resultado esperado, evidencia real, limitaciones y rollback. Nunca incluir tokens o contenido privado en el ZIP. Validación documental de esta entrega no sustituye estos casos conectados.
