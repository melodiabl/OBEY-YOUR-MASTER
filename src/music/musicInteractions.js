const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const TTLCache = require('../core/cache/ttlCache')
const Emojis = require('../utils/emojis')
const Format = require('../utils/formatter')
const { getMusic } = require('./index')
const { getGuildUiConfig, embed, errorEmbed, warnEmbed, okEmbed, headerLine } = require('../core/ui/uiKit')
const { buildNowPlayingEmbed, buildQueueEmbed, buildStoppedEmbed, buildPlayResultEmbed } = require('./musicUi')
const { buildMusicControls, pickId } = require('./musicComponents')

const searchCache = new TTLCache({ defaultTtlMs: 2 * 60_000, maxSize: 50_000 })

function randomToken () {
  return Math.random().toString(36).slice(2, 10)
}

function isUrlLike (input) {
  return /^https?:\/\//i.test(String(input || '').trim())
}

function canControl ({ interaction, state, ownerId }) {
  if (!interaction.guild || !interaction.member) return { ok: false, reason: 'No disponible aquí.' }

  const member = interaction.member
  const voice = member.voice?.channel
  if (!voice) return { ok: false, reason: 'Debes estar en un canal de voz.' }

  if (state?.voiceChannelId && String(state.voiceChannelId) !== String(voice.id)) {
    return { ok: false, reason: 'Debes estar en el mismo canal de voz que el bot.' }
  }

  if (interaction.user.id === ownerId) return { ok: true, voiceChannelId: voice.id }
  return { ok: true, voiceChannelId: voice.id }
}

async function replyErrorEphemeral (client, interaction, { system, title, reason, hint } = {}) {
  const ui = await getGuildUiConfig(client, interaction.guild.id)
  const e = errorEmbed({ ui, system: system || 'music', title, reason, hint })
  return interaction.reply({ embeds: [e], ephemeral: true }).catch(() => {})
}

async function replyWarnEphemeral (client, interaction, { system, title, lines } = {}) {
  const ui = await getGuildUiConfig(client, interaction.guild.id)
  const e = warnEmbed({ ui, system: system || 'music', title, lines })
  return interaction.reply({ embeds: [e], ephemeral: true }).catch(() => {})
}

async function handleControlButton (client, interaction) {
  const parts = String(interaction.customId || '').split(':')
  if (parts.length < 4) return false
  const action = parts[2]
  const ownerId = parts[3]
  if (!/^\d{16,20}$/.test(ownerId)) return false

  const music = getMusic(client)
  if (!music) {
    await replyErrorEphemeral(client, interaction, { reason: 'El sistema de música no está inicializado.' })
    return true
  }

  const guildId = interaction.guild.id
  const state = await music.getQueue({ guildId }).catch(() => null)
  if (!state) {
    await replyErrorEphemeral(client, interaction, { reason: 'No pude obtener el estado de música.' })
    return true
  }

  if (action === 'queue') {
    const player = music.shoukaku.players.get(guildId)
    const position = player ? player.position : 0
    const e = await buildQueueEmbed({ client, guildId, state, positionMs: position, page: 1, pageSize: 8 })
    await interaction.reply({ embeds: [e], ephemeral: true }).catch(() => {})
    return true
  }

  if (action === 'refresh') {
    const player = music.shoukaku.players.get(guildId)
    const position = player ? player.position : 0
    const e = await buildNowPlayingEmbed({ client, guildId, state, positionMs: position })
    const controls = buildMusicControls({ ownerId, state })
    await interaction.update({ embeds: [e], components: controls }).catch(() => {})
    return true
  }

  if (!state.currentTrack) {
    const ui = await getGuildUiConfig(client, guildId)
    const e = buildStoppedEmbed({ ui, reason: 'No hay música para controlar.' })
    await interaction.update({ embeds: [e], components: [] }).catch(() => {})
    return true
  }

  const auth = canControl({ interaction, state, ownerId })
  if (!auth.ok) {
    await replyWarnEphemeral(client, interaction, { title: 'Acceso', lines: [auth.reason] })
    return true
  }

  try {
    if (action === 'toggle') {
      if (state.isPaused) await music.resume({ guildId, voiceChannelId: auth.voiceChannelId })
      else await music.pause({ guildId, voiceChannelId: auth.voiceChannelId })
    } else if (action === 'skip') {
      await music.skip({ guildId, voiceChannelId: auth.voiceChannelId, force: true })
    } else if (action === 'stop') {
      await music.stop({ guildId, voiceChannelId: auth.voiceChannelId })
    } else if (action === 'shuffle') {
      await music.shuffle({ guildId, voiceChannelId: auth.voiceChannelId })
    } else if (action === 'loop') {
      const next = state.loop === 'none' ? 'track' : state.loop === 'track' ? 'queue' : 'none'
      await music.setLoop({ guildId, voiceChannelId: auth.voiceChannelId, mode: next })
    } else {
      return false
    }

    const updated = await music.getQueue({ guildId })
    if (!updated.currentTrack) {
      const ui = await getGuildUiConfig(client, guildId)
      const e = buildStoppedEmbed({ ui, reason: 'Reproducción detenida.' })
      await interaction.update({ embeds: [e], components: [] }).catch(() => {})
      return true
    }

    const player = music.shoukaku.players.get(guildId)
    const position = player ? player.position : 0
    const e = await buildNowPlayingEmbed({ client, guildId, state: updated, positionMs: position })
    const controls = buildMusicControls({ ownerId, state: updated })
    await interaction.update({ embeds: [e], components: controls }).catch(() => {})
    return true
  } catch (e) {
    await replyErrorEphemeral(client, interaction, { reason: e?.message || 'Error desconocido.' })
    return true
  }
}

function buildSearchPickMessage ({ ui, ownerId, token, tracks, query }) {
  const options = tracks.map((t, i) => {
    const label = String(t.title || 'Sin título').slice(0, 95)
    const desc = `${t.author || 'Desconocido'} • ${Format.inlineCode(Math.max(0, Number(t.duration) || 0) ? require('../utils/timeFormat').formatDuration(t.duration) : '00:00')}`
    return { label, value: String(i), description: desc.slice(0, 100) }
  })

  const menu = new StringSelectMenuBuilder()
    .setCustomId(pickId(token, ownerId))
    .setPlaceholder('Elige un resultado…')
    .addOptions(options)

  const row = new ActionRowBuilder().addComponents(menu)

  const e = embed({
    ui,
    system: 'music',
    kind: 'info',
    title: `${Emojis.search} Buscar`,
    description: [
      headerLine(Emojis.music, 'Resultados'),
      `${Emojis.dot} Consulta: ${Format.inlineCode(query.length > 60 ? query.slice(0, 59) + '…' : query)}`,
      `${Emojis.dot} Selecciona un resultado para reproducir.`,
      Format.softDivider(20),
      tracks.map((t, i) => `${Format.inlineCode(i + 1)} ${Emojis.dot} ${Format.bold(t.title)}\n${Emojis.dot} ${Format.italic(t.author)} • ${Format.inlineCode(require('../utils/timeFormat').formatDuration(t.duration))}`).join('\n')
    ].join('\n'),
    signature: 'Búsqueda premium'
  })

  return { embeds: [e], components: [row] }
}

async function handleSearchPick (client, interaction) {
  const parts = String(interaction.customId || '').split(':')
  if (parts.length < 4) return false
  const token = parts[2]
  const ownerId = parts[3]
  if (!token) return false

  const cached = searchCache.get(token)
  if (!cached) {
    await replyErrorEphemeral(client, interaction, { reason: 'Esta selección expiró. Vuelve a usar /play.' })
    return true
  }

  if (interaction.user.id !== cached.ownerId) {
    await replyWarnEphemeral(client, interaction, { title: 'Solo el autor', lines: ['Solo quien ejecutó /play puede elegir el resultado.'] })
    return true
  }

  const picked = Number(interaction.values?.[0])
  const track = cached.tracks?.[picked]
  if (!track) {
    await replyErrorEphemeral(client, interaction, { reason: 'Selección inválida.' })
    return true
  }

  const music = getMusic(client)
  if (!music) {
    await replyErrorEphemeral(client, interaction, { reason: 'El sistema de música no está inicializado.' })
    return true
  }

  const voiceChannel = interaction.member.voice?.channel
  if (!voiceChannel) {
    await replyWarnEphemeral(client, interaction, { title: 'Conéctate a voz', lines: ['Debes estar en un canal de voz para reproducir.'] })
    return true
  }

  try {
    const res = await music.play({
      guildId: interaction.guild.id,
      guild: interaction.guild,
      voiceChannelId: voiceChannel.id,
      textChannelId: interaction.channelId,
      requestedBy: interaction.user,
      query: track.uri
    })

    searchCache.delete(token)

    const e = await buildPlayResultEmbed({ client, guildId: interaction.guild.id, res, voiceChannelId: voiceChannel.id })
    const controls = buildMusicControls({ ownerId: cached.ownerId, state: res.state })
    await interaction.update({ embeds: [e], components: controls }).catch(() => {})
    return true
  } catch (e) {
    await replyErrorEphemeral(client, interaction, { reason: e?.message || 'Error desconocido.' })
    return true
  }
}

async function startSearchPick ({ client, interaction, query }) {
  const music = getMusic(client)
  if (!music) {
    const ui = await getGuildUiConfig(client, interaction.guild.id)
    const e = errorEmbed({ ui, system: 'music', reason: 'El sistema de música no está inicializado.' })
    return { embeds: [e], components: [] }
  }

  const res = await music.search({ query, limit: 5 })
  if (res.isPlaylist && isUrlLike(query)) {
    return null
  }

  const token = randomToken()
  searchCache.set(token, { ownerId: interaction.user.id, tracks: res.tracks, query })

  const ui = await getGuildUiConfig(client, interaction.guild.id)
  return buildSearchPickMessage({ ui, ownerId: interaction.user.id, token, tracks: res.tracks, query })
}

async function handleMusicInteraction (client, interaction) {
  if (!interaction.guild) return false

  if (interaction.isButton?.()) {
    if (String(interaction.customId || '').startsWith('music:ctl:')) {
      return await handleControlButton(client, interaction)
    }
  }

  if (interaction.isStringSelectMenu?.()) {
    if (String(interaction.customId || '').startsWith('music:pick:')) {
      return await handleSearchPick(client, interaction)
    }
  }

  return false
}

module.exports = {
  handleMusicInteraction,
  startSearchPick
}

