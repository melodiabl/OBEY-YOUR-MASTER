# Código público revisado

Siete archivos de cuatro repositorios, fijados por commit. Consulta 22/10/2026. Se leyeron archivos, no se ejecutaron esos proyectos. Los SHA256 corresponden al texto recuperado guardado para revisión; el commit/path es la referencia para volver al original. Las licencias indicadas proceden de metadatos de GitHub; revisar LICENSE y avisos por archivo antes de reutilizar código. OBEY no incorpora código de estos proyectos en esta edición.

## Cog-Creators/Red-DiscordBot · redbot/cogs/audio/core/events/lavalink.py

Commit `004a160b2b8b244d8c623f2f4ede819a2b16d7a1`. [Fuente fijada](https://raw.githubusercontent.com/Cog-Creators/Red-DiscordBot/004a160b2b8b244d8c623f2f4ede819a2b16d7a1/redbot/cogs/audio/core/events/lavalink.py). Licencia declarada: GPL-3.0.

El listener distingue TRACK_START, TRACK_END y QUEUE_END; el último coordina autoplay y sus errores. OBEY debe tener una sola autoridad de avance.


## Cog-Creators/Red-DiscordBot · redbot/cogs/audio/core/commands/queue.py

Commit `004a160b2b8b244d8c623f2f4ede819a2b16d7a1`. [Fuente fijada](https://raw.githubusercontent.com/Cog-Creators/Red-DiscordBot/004a160b2b8b244d8c623f2f4ede819a2b16d7a1/redbot/cogs/audio/core/commands/queue.py). Licencia declarada: GPL-3.0.

La vista de cola lee auto_play, shuffle y repeat y comprueba permisos DJ en operaciones. OBEY presentará el estado confirmado de su servicio.


## botlabs-gg/yagpdb · moderation/modlog.go

Commit `d002e62908167b6eb67cc72177246f2492aad295`. [Fuente fijada](https://raw.githubusercontent.com/botlabs-gg/yagpdb/d002e62908167b6eb67cc72177246f2492aad295/moderation/modlog.go). Licencia declarada: MIT.

ModlogAction reúne semántica visual; CreateModlogEmbed recibe autor, acción, objetivo y motivo. OBEY debe mantener esos campos tipados fuera del texto traducido.


## botlabs-gg/yagpdb · automod/effects.go

Commit `d002e62908167b6eb67cc72177246f2492aad295`. [Fuente fijada](https://raw.githubusercontent.com/botlabs-gg/yagpdb/d002e62908167b6eb67cc72177246f2492aad295/automod/effects.go). Licencia declarada: MIT.

Los efectos contemplan fallos de Discord y acciones diferidas. OBEY distinguirá efecto desconocido, confirmado y notificación fallida.


## jagrosh/MusicBot · src/main/java/com/jagrosh/jmusicbot/audio/AudioHandler.java

Commit `859e5c5862decf433f8face5eaca3372d7d27b22`. [Fuente fijada](https://raw.githubusercontent.com/jagrosh/MusicBot/859e5c5862decf433f8face5eaca3372d7d27b22/src/main/java/com/jagrosh/jmusicbot/audio/AudioHandler.java). Licencia declarada: Apache-2.0.

onTrackEnd repite solo ante FINISHED y decide consumir cola o playlist por defecto. No es código para copiar a lavalink-client.


## poketwo/poketwo · cogs/trading.py

Commit `83349975739fb30bdf7fa3ee6364e552877808e8`. [Fuente fijada](https://raw.githubusercontent.com/poketwo/poketwo/83349975739fb30bdf7fa3ee6364e552877808e8/cogs/trading.py). Licencia declarada: GPL-3.0.

Trading usa ConfirmationView, vencimiento y Redis para estado/cancelación entre clusters. Esto no demuestra por sí solo seguridad transaccional.


## poketwo/poketwo · cogs/market.py

Commit `83349975739fb30bdf7fa3ee6364e552877808e8`. [Fuente fijada](https://raw.githubusercontent.com/poketwo/poketwo/83349975739fb30bdf7fa3ee6364e552877808e8/cogs/market.py). Licencia declarada: GPL-3.0.

Market aplica cambios de compra, propietario y saldos. La inspección no acredita ausencia de carreras; OBEY requiere su propia operación atómica o saga conciliable.

## Base OBEY confirmada

La rama feature/obey-main-implementation sigue en c8ba6d3ee86515813e68a028e1221d093301e91b al consultar GitHub el 22/10/2026. El ZIP conserva además el bootstrap local previamente documentado. No se actualizó, borró ni publicó el repositorio.

Revisar los servicios existentes: handlers/feature-registry.js, handlers/configuration-service.js, handlers/music, handlers/jobs, handlers/assets y handlers/i18n. El manifest musical tiene doce controles y declara jobs durables no implementados. No inferir un runtime de módulos completo por ver un manifest.
