# 🎛️ Motor de música de OBEY — anotación completa

> Referencia para el porte del sistema de música de **Soundy** → OBEY.
> Documenta TODO lo que el motor actual hace, para que el nuevo motor lo re-implemente sin romper los parches específicos del VPS.
> Generado el 2026-06-18 a partir de `handlers/music/`.

---

## 1. Stack

| Capa | OBEY (actual) | Soundy (origen del porte) |
|---|---|---|
| Framework | discord.js v14 | Seyfert |
| Runtime | Node | Bun |
| Cliente Lavalink | **Shoukaku 4** | lavalink-client |
| Lavalink | 4.2.2 + PulseLink + plugins | 4.x |
| DB | MongoDB / Mongoose | Turso / Drizzle |

El motor vive en `handlers/music/` y se expone como **`client.music`** (inicializado en `handlers/music/index.js`, requiere `client.shoukaku`).

---

## 2. Archivos del motor (`handlers/music/`)

| Archivo | Rol |
|---|---|
| `index.js` | Núcleo: API `client.music`, búsqueda, playback, eventos del player, botones |
| `state.js` | Estado por-guild (`playerStates`, `liveMessages`, `liveTimers`, `getState`, `resetState`) |
| `embeds.js` | UI: `buildNPEmbed`, `buildRow1/2/3`, `buildControls`, `buildQueueEmbed`, `buildQueueRows` |
| `searchui.js` | UI de resultados de búsqueda (tabs Pistas/Álbumes + select) |
| `filters.js` | `FILTER_PRESETS`, `FILTER_RESET` (incluye `pluginFilters` de LavaDSPX) |
| `liveupdate.js` | Auto-edición del panel NP (barra de progreso viva) |
| `lyrics.js` | Lyrics: plugin Lavalink (sincronizadas) → fallback **LRCLib** |
| `likes.js` | Favoritos (Fase 1 del porte): toggle, listado paginado, UI |
| `utils.js` | `fmtMs`, `progressBar`, `platform`, `normalizePublicTrack`, `tracksFromResolve`, `MUSIC_ICON` |
| `../discordmusiccatalog.js` | Catálogo: `searchDiscordCatalog`, `enqueueCatalogItem`, `itemInfo`, `_mirrorYouTubeTrack` |

---

## 3. API pública `client.music.*`

| Método | Qué hace |
|---|---|
| `search(query, requester)` | Resuelve vía Lavalink. **Orden: `spsearch` → `ytmsearch` → `ytsearch`**. URLs pasan directas. `spsearch` devuelve 1 track (loadType:track) → se guarda como fallback y sigue buscando lista |
| `play(guildId, vc, tc, query, requester)` | join + search + encola; si no hay track actual, `_playNext` |
| `joinChannel(guildId, vc, tc)` | Une al canal de voz (Shoukaku). Re-bindea eventos y **aplica SponsorBlock** |
| `_playNext(guildId, player)` | Avanza la cola. Maneja loop track/queue, shuffle, **autoplay**, **resolución lazy** de tracks sin `encoded`, y stop si vacío |
| `_recoverFailedTrack(...)` | Si un track falla, reintenta con `ytsearch:title author` (1 intento, flag `_fallbackAttempted`) |
| `skip` `previous` `stop` `pause` | Controles básicos |
| `setVolume(g, vol)` `shuffle` | Volumen (0–200) / mezclar cola |
| `setAutoplay(g, ?)` `setLoop(g, mode)` `setRadioMode(g, ?)` | Toggles. loop: `none`→`track`→`queue` |
| `jump(g, pos)` `remove(g, pos)` `move(g, from, to)` | Operaciones de cola |
| `seek(g, ms)` | Buscar posición |
| `setFilter(g, preset)` | Filtros (ver §7) |
| `sendNowPlaying(g, track)` | Borra panel viejo, envía nuevo panel NP + controles, arranca live update |
| `getState` / `getPublicState` (serializeState) | Estado interno / serializado para dashboard |
| `_bindPlayerEvents(player, g)` | Liga eventos del player (ver §5) |

---

## 4. Modelo de estado (`state.js`, por guild)

```
{ currentTrack, queue[], history[] (máx 10), startedAt, lastPosition, paused,
  loop: 'none'|'track'|'queue', volume, autoplay, shuffle, radioMode,
  filter, voiceChannelId, textChannelId }
```

- **Posición viva**: `Date.now() - startedAt` (NO `player.position`, que es snapshot stale de Lavalink ~5s). El evento `update` mantiene `startedAt` sincronizado.

---

## 5. Eventos del player (Shoukaku)

| Evento | Acción |
|---|---|
| `start` | Setea `startedAt`, envía panel NP, emite estado |
| `end` | Ignora `replaced`/`stopped`; `loadFailed` → `_recoverFailedTrack`; resto → `_playNext` |
| `update` | Actualiza `lastPosition` y recalibra `startedAt` (clave para la barra de progreso) |
| `exception` | `_recoverFailedTrack` |
| `closed` | Limpia estado, para live update, emite |

---

## 6. ⚠️ PARCHES CRÍTICOS DEL VPS (lo que Soundy NO tiene)

> **Esta es la sección más importante del porte.** Si el nuevo motor no re-implementa esto, la música puede dejar de sonar.

1. **Spotify bloquea la IP del VPS** → búsqueda usa `spsearch` vía **PulseLink** (token de servicio externo `140.245.242.153:8082`, LEO API `:8081`). NO volver a la API oficial de Spotify.
2. **Orden de búsqueda** `spsearch → ytmsearch → ytsearch`; `spsearch` devuelve 1 solo track → conservar como fallback y continuar a ytmsearch para listas.
3. **`spotify:album:{id}` da `loadType: empty`** → usar `https://open.spotify.com/album/{id}`.
4. **Catálogo** (`discordmusiccatalog.js`): tracks sin `encoded` se resuelven vía `_mirrorYouTubeTrack()` (ytsearch); el URI original queda en `info.catalogUri` / `info.catalogSourceName`. `platform()` debe mirar primero `catalogSourceName` (el URI ya es de YouTube tras el mirror).
5. **Resolución lazy**: tracks de playlists guardadas vienen sin `encoded` → se resuelven en `_playNext`.
6. **SponsorBlock por-player**: `applySponsorBlock()` hace PUT a `/v4/sessions/{sessionId}/players/{guildId}/sponsorblock/categories` en cada `joinChannel`. Categorías: sponsor, selfpromo, interaction, intro, outro, preview, music_offtopic.
7. **Lyrics**: plugin `java-lyrics-plugin:1.6.6` da vacío para YouTube desde el VPS (bloqueo IP) → **fallback LRCLib** (la fuente que funciona).
8. **Lavalink requiere IPv6** (`preferIPv6Addresses=true` en docker-compose).
9. **Filtros LavaDSPX** (`normalizar`/`eco`/`radio`) usan `pluginFilters`; `FILTER_RESET` debe incluir `pluginFilters: {}`.
10. **Autoplay** busca por **artista** (`ytmsearch:author`), NO por título (evita bucle de la misma canción); excluye URIs/títulos ya reproducidos.

---

## 7. Filtros (`filters.js`)

`FILTER_PRESETS` + `FILTER_RESET`. Presets con `pluginFilters` (LavaDSPX): normalizar, eco, radio. Reset debe limpiar `pluginFilters: {}`.

---

## 8. UI (embeds + controles)

- **Panel NP** (`buildNPEmbed`): author "▶ Reproduciendo" + disco girando (`MUSIC_ICON` gif), título, thumbnail, **barra de progreso viva**, campos (artista/álbum/año/duración/cola/pedido), indicadores (loop/vol/filtro/autoplay/shuffle/radio), color **por plataforma**.
- **Controles** (`buildControls` = filas 1+2+3):
  - Fila 1: prev, toggle(pause/play), skip, loop, shuffle
  - Fila 2: vol−, vol+, queue, autoplay, stop
  - Fila 3: ❤️ favorito (Fase 1)
  - customIds `mp_*` (router en `index.js` ~514) y `mq_*` (cola), `lk_*` (favoritos)
- **Live update** (`liveupdate.js`): auto-edita el panel cada ~2s con la posición viva.
- **Emojis**: la app del bot ya tiene set custom **animado** (`play, pause, skip, stop, loop, shuffle, volume, vol_low, vol_mute, lyrics, queue, back, search, eq, np, music` + plataformas). Faltan `heart` y `disk` (subir).

---

## 9. Integración con el dashboard web (`dashboard/index.js`)

| Evento | Origen | Destino |
|---|---|---|
| `playerStateUpdate` (interno) | `emitState()` en cada cambio | `io.to(guild).emit('player:state', getPublicState())` |
| `player:state` | socket join + cambios | cliente web (panel) |
| `player:tick` | timer ~2s | `{ elapsed, length }` (barra web) |

`serializeState()` produce el payload público (current, queue, flags, etc.). **Cualquier motor nuevo DEBE seguir emitiendo `playerStateUpdate` y exponer `getPublicState` o el panel web se rompe.**

---

## 10. Persistencia (Mongo)

- `MusicHistorySchema` — historial por guild (`rememberTrack`, upsert por `{guildId, uri}`, cuenta `plays`).
- `LikedSongsSchema` — favoritos por usuario (Fase 1; índice único `{userId, trackId}`).

---

## 11. Checklist para el porte del motor de Soundy

- [ ] Resolución `spsearch→ytmsearch→ytsearch` con fallback de track único
- [ ] Catálogo + mirror YouTube (`catalogUri`/`catalogSourceName`)
- [ ] Resolución lazy de tracks sin `encoded`
- [ ] `_recoverFailedTrack` (reintento ytsearch)
- [ ] SponsorBlock por-player (PUT a la sesión)
- [ ] Lyrics con fallback LRCLib
- [ ] Filtros con `pluginFilters` y reset correcto
- [ ] Autoplay por artista, anti-bucle
- [ ] Posición viva con `startedAt` (no `player.position`)
- [ ] Emitir `playerStateUpdate` + `getPublicState` para el dashboard
- [ ] `player:tick` para la barra web
- [ ] Persistir historial + favoritos en Mongo
- [ ] Color de embed por plataforma + disco animado + barra de progreso (ventajas de OBEY a conservar)
