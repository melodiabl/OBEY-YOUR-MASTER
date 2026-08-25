// ─────────────────────────────────────────────────────────────────────────────
// OBEY — Motor de música: Lyrics karaoke EN VIVO (port de Soundy lavalink/lyrics/line.ts).
// Usa los timestamps LRC de lrclib + la posición viva del player y auto-edita el mensaje.
// El panel PERSISTE: sigue a la canción (si cambia, recarga letras en el mismo mensaje)
// y solo se borra al desactivarlo (toggle) o al parar la música por completo.
// ─────────────────────────────────────────────────────────────────────────────
const { EmbedBuilder } = require('discord.js')
const { fetchLyrics, getLyricContext } = require('./lyrics')
const { config } = require('./config')

const DISK = 'https://cdn.darrennathanael.com/icons/spinning_disk.gif'
const TICK_MS = 2500
const sessions = new Map() // guildId -> { messageId, channelId, lines, timer, trackKey }

function trackKey(info) { return info?.identifier || info?.uri || info?.title || '' }
function livePos(st) { return st?.startedAt && !st.paused ? Date.now() - st.startedAt : (st?.lastPosition || 0) }

function renderEmbed(info, lines, pos) {
  const e = new EmbedBuilder()
    .setColor(config.color.primary)
    .setAuthor({ name: `Letras · ${(info?.title || 'Desconocido').slice(0, 80)}`, iconURL: DISK })
  if (!lines?.length) {
    return e.setDescription('🔇 Esta canción no tiene letras sincronizadas.').setFooter({ text: 'En espera de una canción con letra…' })
  }
  const ctx  = getLyricContext(lines, pos)
  const idx  = ctx?.index ?? 0
  const WIN  = Math.max(3, config.lyricsLines || 7)
  const half = Math.floor(WIN / 2)
  let start = Math.max(0, idx - half)
  let end   = Math.min(lines.length, start + WIN)
  start = Math.max(0, end - WIN)
  const body = lines.slice(start, end).map((l, i) => {
    const active = start + i === idx
    const text = l.text || '♪'
    return active ? `**➤ ${text}**` : `​ ${text}`
  }).join('\n')
  return e.setDescription(body || '♪').setFooter({ text: `Línea ${idx + 1}/${lines.length} · sincronizado` })
}

function isActive(guildId) { return sessions.has(guildId) }

function stop(guildId, client) {
  const sess = sessions.get(guildId)
  if (!sess) return
  clearInterval(sess.timer)
  sessions.delete(guildId)
  if (client) {
    const ch = client.channels.cache.get(sess.channelId)
    ch?.messages.fetch(sess.messageId).then(m => m.delete().catch(() => {})).catch(() => {})
  }
}

// Devuelve { ok, reason?, plain? }
async function start(client, guildId) {
  const state = client.music?.getState(guildId)
  if (!state?.currentTrack || !state.textChannelId) return { ok: false, reason: 'no_track' }
  const info = state.currentTrack.info || state.currentTrack

  const result = await fetchLyrics(info.title, info.author).catch(() => null)
  const lines  = result?.lines || []
  if (!lines.length) return { ok: false, reason: result?.plain ? 'no_sync' : 'not_found', plain: result?.plain }

  stop(guildId, client)
  const channel = client.channels.cache.get(state.textChannelId)
  if (!channel) return { ok: false, reason: 'no_channel' }

  const msg = await channel.send({ embeds: [renderEmbed(info, lines, livePos(state))] }).catch(() => null)
  if (!msg) return { ok: false, reason: 'send_fail' }

  const sess = { messageId: msg.id, channelId: channel.id, lines, timer: null, trackKey: trackKey(info) }
  sessions.set(guildId, sess)

  sess.timer = setInterval(async () => {
    try {
      const st = client.music?.getState(guildId)
      // Sin música AHORA: no borrar (puede ser transitorio); deja el último estado.
      if (!st?.currentTrack) return
      const cur = st.currentTrack.info || st.currentTrack
      // Cambió de canción → recargar letras en el MISMO mensaje (no borrar)
      if (trackKey(cur) !== sess.trackKey) {
        sess.trackKey = trackKey(cur)
        const r = await fetchLyrics(cur.title, cur.author).catch(() => null)
        sess.lines = r?.lines || []
      }
      await msg.edit({ embeds: [renderEmbed(cur, sess.lines, livePos(st))] }).catch(() => {})
    } catch { /* nunca dejar caer el intervalo */ }
  }, TICK_MS)

  return { ok: true }
}

module.exports = { start, stop, isActive }
