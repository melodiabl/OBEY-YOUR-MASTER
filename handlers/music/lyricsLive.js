// ─────────────────────────────────────────────────────────────────────────────
// OBEY — Motor de música: Lyrics karaoke EN VIVO (port de Soundy lavalink/lyrics/line.ts).
// Usa los timestamps LRC de lrclib + la posición viva del player y auto-edita el mensaje.
// El panel PERSISTE: sigue a la canción (si cambia, recarga letras en el mismo mensaje)
// y solo se borra al desactivarlo (toggle) o al parar la música por completo.
// ─────────────────────────────────────────────────────────────────────────────
const { EmbedBuilder } = require('discord.js')
const { fetchLyrics, getLyricContext } = require('./lyrics')
const { config } = require('./config')
const MusicGuild = require('../../database/schemas/MusicGuildSchema')
const writes = require('./action-queue').createActionQueue()
const waitingPanels = new Map()
const restorationClients = new WeakSet()

const DISK = 'https://cdn.darrennathanael.com/icons/spinning_disk.gif'
const TICK_MS = 500
const clock = require('./playback-clock')
const pendingStarts = new Map()
const sessions = new Map() // guildId -> { messageId, channelId, lines, timer, trackKey }

function trackKey(info, state) { return JSON.stringify([info?.identifier || info?.uri || info?.title || '', info?.length, state?.playbackId]) }
function livePos(state) { return clock.position(state) }

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
  return e.setDescription((body || '♪').slice(0, 4096)).setFooter({ text: idx < 0 ? 'Introducción · sincronizado' : `Línea ${idx + 1}/${lines.length} · sincronizado` })
}

function isActive(guildId) { return sessions.has(guildId) || pendingStarts.has(guildId) || waitingPanels.has(guildId) }

function stop(guildId, client) {
  const hadPanel = isActive(guildId)
  pendingStarts.delete(guildId)
  waitingPanels.delete(guildId)
  clearSession(guildId, client)
  return hadPanel ? savePanel(client, guildId, null) : Promise.resolve()
}
function clearSession(guildId, client) {
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
async function start(client, guildId, options = {}) {
  const request = Symbol('lyrics lookup')
  pendingStarts.set(guildId, request)
  try {
    const state = client.music?.getState(guildId)
    if (!state?.currentTrack || !(options.existing?.channelId || state.textChannelId)) return { ok: false, reason: 'no_track' }
    const requestedTrack = state.currentTrack
    const playbackId = state.playbackId, sessionId = state.sessionId, channelId = options.existing?.channelId || state.textChannelId
    const requestedTextChannel = state.textChannelId
    const info = requestedTrack.info || requestedTrack
    const isCurrent = () => {
      const latest = client.music?.getState(guildId)
      return pendingStarts.get(guildId) === request && latest?.currentTrack === requestedTrack && latest.playbackId === playbackId && latest.sessionId === sessionId && latest.textChannelId === requestedTextChannel
    }
    const result = await fetchLyrics(info.title, info.author, client.music?.getLyricsOptions?.(guildId) || { durationMs: info.length }).catch(() => null)
    const lines = result?.lines || []
    if (!isCurrent()) return { ok: false, reason: 'track_changed' }
    if (!lines.length && !options.existing) return { ok: false, reason: result?.plain ? 'no_sync' : 'not_found', plain: result?.plain }

    clearSession(guildId, client)
    const channel = client.channels.cache.get(channelId)
    if (!channel) return { ok: false, reason: 'no_channel' }
    const initialEmbed = renderEmbed(info, lines, livePos(state))
    const msg = options.existing
      ? await channel.messages.fetch(options.existing.messageId).catch(() => null)
      : await channel.send({ embeds: [initialEmbed], allowedMentions: { parse: [] } }).catch(() => null)
    if (options.existing && (!msg || msg.author?.id !== client.user?.id)) return { ok: false, reason: 'missing_panel' }
    if (!msg) return { ok: false, reason: 'send_fail' }
    if (!isCurrent()) {
      if (!options.existing) await msg.delete().catch(() => {})
      return { ok: false, reason: 'track_changed' }
    }

    if (options.existing) await msg.edit({ embeds: [initialEmbed], allowedMentions: { parse: [] } })
    try { await savePanel(client, guildId, { messageId: msg.id, channelId: channel.id }) }
    catch (error) {
      if (!options.existing) await msg.delete().catch(() => {})
      console.warn('[Music] Lyrics persistence failed:', error.code || error.name)
      return { ok: false, reason: 'store_failed' }
    }
    if (!isCurrent()) return { ok: false, reason: 'track_changed' }
    waitingPanels.delete(guildId)
    const sess = { messageId: msg.id, channelId: channel.id, lines, timer: null, trackKey: trackKey(info, state), lastLookupAt: Date.now(), lastPayload: JSON.stringify(initialEmbed.toJSON()), lastEditAt: Date.now() }
    sessions.set(guildId, sess)

    sess.timer = setInterval(async () => {
      if (sess.busy || sessions.get(guildId) !== sess) return
      sess.busy = true
      try {
        const st = client.music?.getState(guildId)
        // Sin música AHORA: no borrar (puede ser transitorio); deja el último estado.
        if (!st?.currentTrack) return
        const cur = st.currentTrack.info || st.currentTrack
        // Cambió de canción → recargar letras en el MISMO mensaje (no borrar)
        if (trackKey(cur, st) !== sess.trackKey || (!sess.lines.length && Date.now() - sess.lastLookupAt >= 30000)) {
          const requestedKey = trackKey(cur, st), requestedTrack = st.currentTrack, playbackId = st.playbackId
          const r = await fetchLyrics(cur.title, cur.author, client.music?.getLyricsOptions?.(guildId) || { durationMs: cur.length }).catch(() => null)
          const latest = client.music?.getState(guildId)?.currentTrack
          if (sessions.get(guildId) !== sess || latest !== requestedTrack || client.music?.getState(guildId)?.playbackId !== playbackId) return
          sess.lastLookupAt = Date.now()
          sess.trackKey = requestedKey
          sess.lines = r?.lines || []
        }
        if (sessions.get(guildId) !== sess) return
        const embed = renderEmbed(cur, sess.lines, livePos(st))
        const payload = JSON.stringify(embed.toJSON())
        if (payload === sess.lastPayload || Date.now() - sess.lastEditAt < 1000) return
        await msg.edit({ embeds: [embed] })
        sess.lastPayload = payload; sess.lastEditAt = Date.now()
      } catch (error) {
        if (error.code === 10008) await stop(guildId, client).catch(() => {})
        else console.warn('[Music] Lyrics update failed:', error.code || error.name)
      }
      finally { sess.busy = false }
    }, TICK_MS)

    return { ok: true }
  } finally {
    if (pendingStarts.get(guildId) === request) pendingStarts.delete(guildId)
  }
}

function savePanel(client, guildId, panel) {
  if (!client?._dbReady) return Promise.resolve()
  return writes.run(guildId, () => MusicGuild.updateOne({ id: guildId }, { $set: {
    lyricsLiveEnabled: Boolean(panel), lyricsLiveMessageId: panel?.messageId || null, lyricsLiveChannelId: panel?.channelId || null,
  } }, { upsert: true }))
}

async function resumePanel(client, guildId) {
  const row = waitingPanels.get(guildId)
  if (!row || pendingStarts.has(guildId) || sessions.has(guildId) || !client.music?.getState(guildId)?.currentTrack || client._shuttingDown) return
  const result = await start(client, guildId, { existing: { messageId: row.lyricsLiveMessageId, channelId: row.lyricsLiveChannelId } })
  if (result.reason === 'missing_panel') { waitingPanels.delete(guildId); await savePanel(client, guildId, null) }
  if (result.ok) console.info('[Music] Lyrics panel restored:', JSON.stringify({ guildId }))
}

async function restore(client, records) {
  if (!restorationClients.has(client)) {
    restorationClients.add(client)
    client.on?.('playerStateUpdate', guildId => resumePanel(client, guildId).catch(error => console.warn('[Music] Lyrics recovery failed:', error.code || error.name)))
  }
  const rows = records || await MusicGuild.find({ lyricsLiveEnabled: true }, 'id lyricsLiveEnabled lyricsLiveMessageId lyricsLiveChannelId').lean()
  for (const row of rows) {
    if (!row.lyricsLiveMessageId || !row.lyricsLiveChannelId || (client.guilds && !client.guilds.cache.has(row.id))) continue
    const channel = client.channels.cache.get(row.lyricsLiveChannelId)
    if (!channel || (channel.guildId && channel.guildId !== row.id)) continue
    waitingPanels.set(row.id, row)
    if (client.music?.getState(row.id)?.currentTrack) await resumePanel(client, row.id)
    else {
      const message = await channel.messages.fetch(row.lyricsLiveMessageId).catch(() => null)
      if (message?.author?.id === client.user?.id) await message.edit({ embeds: [new EmbedBuilder().setColor(config.color.primary).setDescription('Las letras seguirán la próxima canción.').setFooter({ text: 'En espera de reproducción' })], allowedMentions: { parse: [] } })
      else { waitingPanels.delete(row.id); await savePanel(client, row.id, null) }
    }
  }
}

function suspend() {
  for (const session of sessions.values()) clearInterval(session.timer)
  sessions.clear(); pendingStarts.clear(); waitingPanels.clear()
}

module.exports = { start, stop, isActive, restore, suspend, flush: writes.drain }
