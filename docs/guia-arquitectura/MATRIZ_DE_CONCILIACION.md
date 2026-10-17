# Matriz de conciliación

Las rutas se verificaron contra el árbol del commit remoto citado. Su presencia no certifica funciones ni es inventario exhaustivo de consumidores.

| Módulo | Base encontrada | Destino propuesto | Decisión |
| --- | --- | --- | --- |
| music | `dashboard/music-realtime.js`; `dashboard/music-visibility.js`; `dashboard/nodes-routes.js` | `src/modules/music` | Auditar y adaptar |
| welcome | `dashboard/welcome-routes.js`; `handlers/configuration-service.js`; `handlers/configuration.js` | `src/modules/welcome` | Auditar y adaptar |
| verification | Sin dominio confirmado | `src/modules/verification` | Diferir y confirmar alcance |
| roles | `commands/Administration/addrole.js`; `commands/Administration/addroletobots.js`; `commands/Administration/addroletoeveryone.js` | `src/modules/roles` | Auditar y adaptar |
| moderation | `database/schemas/ModerationSchema.js`; `handlers/moderation/action.js`; `handlers/moderation/cases.js` | `src/modules/moderation` | Auditar y adaptar |
| logs | `handlers/boostlog.js`; `handlers/ghost_ping_detector.js`; `handlers/logger.js` | `src/modules/logs` | Auditar y adaptar |
| security | `handlers/anti_nuke.js`; `handlers/antiselfbot.js` | `src/modules/security` | Auditar y adaptar |
| automod | `handlers/anticaps.js`; `handlers/antidiscord.js`; `handlers/antilinks.js` | `src/modules/automod` | Auditar y adaptar |
| levels | `database/schemas/RankingSchema.js`; `handlers/cards/rankcard.js`; `handlers/ranking.js` | `src/modules/levels` | Auditar y adaptar |
| profiles | `database/schemas/UserProfileSchema.js`; `handlers/membership-title.js` | `src/modules/profiles` | Auditar y adaptar |
| voice | `database/schemas/JTCSchema.js`; `handlers/jointocreate.js`; `handlers/joinvc.js` | `src/modules/voice` | Auditar y adaptar |
| events | Sin dominio confirmado | `src/modules/events` | Diferir y confirmar alcance |
| giveaways | `database/schemas/GiveawaySchema.js`; `handlers/command.js`; `handlers/giveaway.js` | `src/modules/giveaways` | Auditar y adaptar |
| suggestions | `handlers/suggest.js`; `handlers/suggestions/presentation.js` | `src/modules/suggestions` | Auditar y adaptar |
| starboard | Sin dominio confirmado | `src/modules/starboard` | Diferir y confirmar alcance |
| reminders | `database/schemas/BirthdaySchema.js`; `handlers/birthdayScheduler.js`; `handlers/timedmessages.js` | `src/modules/reminders` | Auditar y adaptar |
| messages | `commands/Administration/embed.js`; `commands/Administration/embedbuilder.js`; `commands/Administration/updatemessage.js` | `src/modules/messages` | Auditar y adaptar |
| cards | `dashboard/cards-routes.js`; `handlers/card-assets.js`; `handlers/card-background.js` | `src/modules/cards` | Auditar y adaptar |
| automation | `database/schemas/CustomCommandSchema.js`; `database/schemas/KeywordSchema.js`; `handlers/keyword.js` | `src/modules/automation` | Auditar y adaptar |
| feeds | `database/schemas/TikTokSchema.js`; `database/schemas/YouTubeSchema.js`; `social_log/livelog.js` | `src/modules/feeds` | Auditar y adaptar |
| analytics | `database/schemas/StatsSchema.js`; `database/schemas/UserStatsSchema.js`; `handlers/NumberCounter.js` | `src/modules/analytics` | Auditar y adaptar |
| utilities | `dashboard/help-routes.js`; `handlers/help.js`; `handlers/helpui.js` | `src/modules/utilities` | Auditar y adaptar |
| fun | `handlers/games-choice.js`; `handlers/games.js`; `handlers/games/board-image.js` | `src/modules/fun` | Auditar y adaptar |
| architect | `dashboard/architect-routes.js`; `handlers/architect.js`; `handlers/architect/application-repository.js` | `src/modules/architect` | Auditar y adaptar |
| decoration | `handlers/architect/decoration.js`; `handlers/architect/themes.js` | `src/modules/decoration` | Auditar y adaptar |
| templates | `database/schemas/TemplateSchema.js`; `handlers/templates/format.js`; `handlers/templates/merge.js` | `src/modules/templates` | Auditar y adaptar |
| collections | Sin dominio confirmado | `src/modules/collections` | Diferir y confirmar alcance |
| applications | `handlers/apply.js`; `handlers/tickets/application-buttons.js` | `src/modules/applications` | Auditar y adaptar |
| sticky | `database/schemas/StickySchema.js`; `handlers/sticky/discord-transport.js`; `handlers/sticky/mongo-store.js` | `src/modules/sticky` | Auditar y adaptar |
| migrations | `handlers/music/playlist-repository.js` | `src/modules/migrations` | Auditar y adaptar |
| tickets | `database/schemas/TicketSchema.js`; `handlers/ticket.js`; `handlers/ticketevent.js` | `src/modules/tickets` | Auditar y adaptar |
| economy | `commands/Economy/balance.js`; `commands/Economy/bank.js`; `commands/Economy/beg.js` | `src/modules/economy` | Auditar y adaptar |

## Registro que completa Codex por capacidad

| Campo | Evidencia necesaria |
| --- | --- |
| Entrada | Nombre real, alias, customId, ruta, evento o job y registro que lo carga |
| Propietario | Servicio y fuente de verdad; escrituras de otros módulos por conciliar |
| Configuración | Clave runtime, tipo, defaults efectivos y mapping al contrato objetivo |
| Resultado | Efecto confirmado, notificación separada, parcial o desconocido |
| Decisión | Conservar, adaptar, aliasar o retirar con compatibilidad |
| Cierre | Caso, SHA, resultado observado, límites, rollback y referencias restantes |
