# OBEY YOUR MASTER — Roadmap de completitud bot + web

> Estado (2026-06-11): 628 prefix · **18 grupos slash desplegados** (Admin, Anime, Birthday, Config,
> Economy, Fun, Giveaway, Info, Invites, Moderation, Music 25, NSFW, Playlist, Rank, Soundboard, Ticket, Welcome, chat)
> Música: modular en `handlers/music/` · spsearch→ytmsearch→ytsearch · sin catálogo/mirror · LEO solo para álbumes web
> Web: 5 páginas · player con RAF sin rebote (fix `player.position` stale) · preview de álbumes ok
> Infra: Docker Compose (bot + Lavalink 4.2.2 + PulseLink) · MongoDB · Sentry

## ✅ Completado (no retrabajar)

- Fase 1 (paridad slash): Moderation, Config, Economy, Rank, Soundboard (autocomplete), Fun, Anime (autocomplete), Info (25/25), Music (25/25), Playlist (7), NSFW, Ticket, Welcome, Birthday, Giveaway, Invites
- Fase 2 parcial: playlists usuario MongoDB (`/playlist` 7 subcmds), historial (`/music history` + MusicHistory schema), lyrics LRCLib (`lyrics.js`), filtros 13 presets, autoplay básico (ytmsearch), recovery de tracks fallidos
- Web player: barra RAF estable, metadata normalizada (`normalizePublicTrack`), álbumes discover vía LEO `/api/resolve`, preview de álbum con tracks

---

## FASE A — Cerrar paridad slash (lo poco que queda) 🎯

| Prioridad | Sistema | Prefix hoy | Plan |
|---|---|---|---|
| 1 | 🎮 MiniGames (34) | solo prefix | `/game <juego>` con subcomandos: ttt, rps, trivia, hangman, snake, 2048, memory… — botones, no reacciones |
| 2 | 🚫 Automod | parte de Administration | `/automod` (antispam, antilinks, anticaps, antiinvite, blacklist palabras) — toggles por guild en MongoDB |
| 3 | 🎤 Voice / J2C | prefix | `/voice` (lock, limit, rename, claim, transfer) para Join2Create |
| 4 | ⚜️ Custom Queue(s) | prefix | evaluar si se fusiona con `/playlist` o se elimina (posible código muerto) |
| 5 | ⌨️ Programming + 🏫 School | prefix | bajo valor — decidir: migrar lo útil (`/tools` con encode/decode/calc) o deprecar |

**Regla:** lógica en `handlers/`, prefix queda como wrapper. Límite 25 subcmds por grupo, 100 grupos globales.

---

## FASE B — Música nivel Rythm/Hydra 🎶

1. **Modo 24/7** — `/music 247`: el bot no sale del canal al vaciarse; persistir flag en MongoDB y reconectar tras restart. (Music está a 25/25 — mover otro subcmd a `.bak` o crear grupo `/dj`)
2. **Modo DJ** — rol DJ configurable (`/config dj-role`); sin rol → vote-skip (integrar voteskip existente)
3. **Letras sincronizadas** — `lyrics.js` ya parsea LRC: mostrar línea actual en panel NP (edit cada ~5s) y en la web en vivo (socket `player:lyric`)
4. **Autoplay inteligente** — semilla = últimas 5 del MusicHistory del guild (no solo la última canción); filtrar ya reproducidas
5. **Anuncios configurables** — modo silencioso (sin panel NP por canción) o canal fijo de música
6. **Favoritos por usuario** — `/playlist like` (botón ❤️ en NP guarda a playlist "Favoritos" automática)
7. **Crossfade / normalización de volumen** — investigar soporte del plugin de filtros de Lavalink

---

## FASE C — Web dashboard completo 🌐

### C1. Configuración por módulo (espejo de `/config`)
- Página por guild con tabs: General (prefix, idioma, color) · Welcome/Leave (preview canvas) · Automod · Logs · Join2Create · Tickets · Reaction Roles (builder visual) · Birthday
- Backend: `POST /api/guild/:id/config/:module` + validación + mismo storage que los comandos; check `ManageGuild` en cada ruta (patrón anti-IDOR ya aplicado)

### C2. Moderación web
- Tabla de casos (warns/mutes/bans) con búsqueda/paginación — datos ya en mod case logging
- Acciones desde la web (revocar warn, unban) con confirmación

### C3. Música web (ampliar player.ejs)
- Cola **drag & drop** (reorder vía socket)
- Playlists del usuario listadas y reproducibles desde la web (datos ya en MongoDB)
- Letras en vivo en el panel central (Fase B3)
- Historial del guild como sección "Escuchado recientemente" (ya hay datos)

### C4. Páginas públicas
- Leaderboard público `/leaderboard/:guildId` (rank + economía, sin login)
- Página de comandos autogenerada desde los archivos (628 docs gratis)
- `/status` — uptime, latencia, nodos Lavalink, memoria

### C5. Arquitectura web
- `dashboard/index.js` (~900 líneas) → dividir en `routes/`: `auth.js`, `api-player.js`, `api-guild.js`, `public.js`
- `express-rate-limit` en `/api/*` + helmet

---

## FASE D — Diferenciadores (lo que casi ningún bot tiene) ✨

1. **Custom commands / tags** — `/tag create|use` por guild (respuestas con variables: {user}, {server})
2. **Recordatorios** — `/remind me in 2h …` (cron + DM)
3. **Encuestas** — `/poll` con botones y resultados en vivo
4. **Sugerencias** — `/suggest` + canal con votos 👍👎 y estados (aprobada/rechazada)
5. **Starboard** — mensajes con ⭐ N se copian a un canal destacados
6. **Notificaciones sociales** — Twitch ya existe; añadir YouTube (RSS) y opcional Kick
7. **Embed builder web** — crear/enviar embeds desde el dashboard a cualquier canal
8. **Mensajes programados** — desde web o `/schedule message`
9. **AI chat mejorado** — `chat.js` existe; darle memoria por canal y persona configurable

---

## FASE E — Calidad e infraestructura 🛡️

1. ✅ **Healthchecks Docker** — bot (node http ping a :3002, `healthy` verificado) + Lavalink (wget `/version` con auth; aplica en su próximo recreate)
2. ✅ **Backups MongoDB** — `scripts/mongo-backup.sh` (mongodump dockerizado → `/home/backups/mongo`, retención 7d) + cron diario 04:00; probado (54MB)
3. ✅ **Tests música** — 18/18 pasan; tests obsoletos del catálogo reescritos para spsearch→ytmsearch + fallback + álbum URI. Pendiente: tests de economy y rank
4. **i18n** — auditar que comandos nuevos usen `client.la[ls]` (pendiente — sweep grande)
5. ✅ **Limpieza** — eliminados `handlers/playermanager.js` + `playermanagers/` + `databases/` (legacy Enmap vacío); setup-radio migrado a `client.music.play` y Shoukaku
6. **Sharding-ready** — solo si >2000 guilds; mantener código sin estado global que lo impida

---

## Orden recomendado

```
Semana 1 : A1 + A2 (/game + /automod)                 ← cierra la paridad
Semana 2 : B1-B3 (24/7, DJ, letras sync)              ← música "premium"
Semana 3 : C1 (config web)                            ← el mayor salto visible de la web
Semana 4 : C3 + C4 (música web + páginas públicas)
Semana 5 : D1-D4 (tags, remind, poll, suggest)        ← diferenciadores rápidos
Semana 6 : C2 + D5-D7 (mod web, starboard, embeds)
Continuo : E (un ítem por semana en paralelo)
```

**Regla de oro:** cada sistema migrado extrae su lógica a `handlers/`; prefix y slash son wrappers
(patrón probado con `client.music`). Verificar siempre límite de 25 subcmds y deploy con logs.
