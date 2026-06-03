/**
 * Music handler - Shoukaku 4 + Lavalink 4
 * Replaces erela.js completely
 */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js')

const playerStates = new Map()  // guildId → { queue, currentTrack, loop, volume, filter, textChannelId, voiceChannelId }
const liveMessages  = new Map()  // guildId → { messageId, channelId }

function getState(guildId) {
  if (!playerStates.has(guildId)) {
    playerStates.set(guildId, {
      queue: [], currentTrack: null,
      loop: 'none', volume: 100,
      filter: 'none', textChannelId: null,
      voiceChannelId: null, autoplay: false,
    })
  }
  return playerStates.get(guildId)
}

function buildNowPlayingEmbed(client, guildId, track, state) {
  const ee = require('../botconfig/embed.json')
  const dur = track.info?.length ?? 0
  const formatMs = ms => {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
  }
  return new EmbedBuilder()
    .setColor(ee.wrongcolor || '#ff0000')
    .setTitle('🎵 Now Playing')
    .setDescription(`**[${track.info?.title}](${track.info?.uri})**\n by ${track.info?.author}`)
    .addFields(
      { name: '⏱ Duration', value: formatMs(dur), inline: true },
      { name: '🔁 Loop', value: state.loop, inline: true },
      { name: '🔊 Volume', value: `${state.volume}%`, inline: true },
    )
    .setThumbnail(track.info?.artworkUrl || null)
    .setFooter({ text: `Requested by ${track.info?.requester || 'Unknown'}` })
}

function buildMusicButtons(guildId, state) {
  const paused = state.paused
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('music_toggle').setEmoji(paused ? '▶️' : '⏸️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('music_shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('music_loop').setLabel(state.loop === 'none' ? 'Loop' : state.loop === 'track' ? '🔂' : '🔁').setStyle(state.loop !== 'none' ? ButtonStyle.Success : ButtonStyle.Secondary),
  )
}

module.exports = client => {
  if (!client.shoukaku) {
    console.warn('[Music] Shoukaku no inicializado, sistema de música desactivado'.yellow)
    return
  }

  client.music = {
    getState,
    playerStates,
    liveMessages,

    async joinChannel(guildId, voiceChannelId, textChannelId) {
      const existing = client.shoukaku.players.get(guildId)
      if (existing) return existing
      const node = client.shoukaku.options.nodeResolver(client.shoukaku.nodes)
      if (!node) throw new Error('No hay nodos Lavalink disponibles.')
      const player = await client.shoukaku.joinVoiceChannel({ guildId, channelId: voiceChannelId, shardId: 0 })
      const state = getState(guildId)
      state.voiceChannelId = voiceChannelId
      state.textChannelId  = textChannelId
      this._bindPlayerEvents(player, guildId)
      return player
    },

    async search(query, requester) {
      const node = client.shoukaku.options.nodeResolver(client.shoukaku.nodes)
      if (!node) throw new Error('No hay nodos Lavalink disponibles.')
      // Prefijo de búsqueda: si no es URL, usar ytsearch:
      const isUrl = /^https?:\/\//i.test(query)
      const identifier = isUrl ? query : `ytsearch:${query}`
      const res = await node.rest.resolve(identifier)
      if (!res || !res.data) return null
      const loadType = res.loadType
      if (['error', 'empty'].includes(loadType)) return null
      let tracks = []
      if (loadType === 'track') tracks = [res.data]
      else if (loadType === 'playlist') tracks = res.data.tracks || []
      else if (['search', 'SHORT'].includes(loadType)) tracks = Array.isArray(res.data) ? res.data : []
      tracks.forEach(t => { if (t.info) t.info.requester = typeof requester === 'string' ? requester : requester?.username || requester?.tag || 'Unknown' })
      return { loadType, tracks, playlistName: res.data?.info?.name || null }
    },

    async play(guildId, voiceChannelId, textChannelId, query, requester) {
      const player = await this.joinChannel(guildId, voiceChannelId, textChannelId)
      const result = await this.search(query, requester)
      if (!result?.tracks?.length) return null
      const state = getState(guildId)
      const toAdd = result.loadType === 'playlist' ? result.tracks : [result.tracks[0]]
      for (const track of toAdd) state.queue.push(track)
      if (!state.currentTrack) await this._playNext(guildId, player)
      return { result, state }
    },

    async _playNext(guildId, player) {
      const state = getState(guildId)
      if (!player) player = client.shoukaku.players.get(guildId)
      if (!player) return
      if (state.loop === 'track' && state.currentTrack) {
        await player.playTrack({ track: { encoded: state.currentTrack.encoded } })
        return
      }
      if (state.loop === 'queue' && state.currentTrack) state.queue.push(state.currentTrack)
      const next = state.queue.shift()
      if (!next) {
        state.currentTrack = null
        await player.stopTrack()
        return
      }
      state.currentTrack = next
      await player.playTrack({ track: { encoded: next.encoded } })
    },

    async skip(guildId) {
      const player = client.shoukaku.players.get(guildId)
      if (!player) return false
      const state = getState(guildId)
      state.loop = state.loop === 'track' ? 'none' : state.loop
      await player.stopTrack()
      return true
    },

    async stop(guildId) {
      const player = client.shoukaku.players.get(guildId)
      const state = getState(guildId)
      state.queue = []; state.currentTrack = null; state.loop = 'none'
      if (player) {
        await player.stopTrack()
        await client.shoukaku.leaveVoiceChannel(guildId)
      }
      playerStates.delete(guildId)
    },

    async pause(guildId) {
      const player = client.shoukaku.players.get(guildId)
      if (!player) return
      const state = getState(guildId)
      state.paused = !state.paused
      await player.setPaused(state.paused)
      return state.paused
    },

    async setVolume(guildId, vol) {
      const player = client.shoukaku.players.get(guildId)
      const state = getState(guildId)
      const v = Math.max(0, Math.min(100, vol))
      state.volume = v
      if (player) await player.setGlobalVolume(v)
    },

    async shuffle(guildId) {
      const state = getState(guildId)
      for (let i = state.queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.queue[i], state.queue[j]] = [state.queue[j], state.queue[i]]
      }
    },

    setLoop(guildId, mode) {
      const state = getState(guildId)
      state.loop = ['none','track','queue'].includes(mode) ? mode : 'none'
      return state.loop
    },

    async sendNowPlaying(guildId, track) {
      const state = getState(guildId)
      if (!state.textChannelId) return
      const channel = client.channels.cache.get(state.textChannelId)
      if (!channel) return
      const embed = buildNowPlayingEmbed(client, guildId, track, state)
      const row   = buildMusicButtons(guildId, state)
      const msg   = await channel.send({ embeds: [embed], components: [row] }).catch(() => null)
      if (msg) liveMessages.set(guildId, { messageId: msg.id, channelId: channel.id })
    },

    _bindPlayerEvents(player, guildId) {
      player.on('end', async (data) => {
        // Solo pasar a siguiente cuando la pista terminó normalmente
        if (data?.reason === 'replaced' || data?.reason === 'stopped') return
        try { await this._playNext(guildId, player) } catch {}
      })
      player.on('start', async () => {
        const state = getState(guildId)
        if (state.currentTrack) await this.sendNowPlaying(guildId, state.currentTrack)
      })
      player.on('exception', data => {
        console.error('[Music] Player exception:', data?.exception?.message)
      })
      player.on('closed', () => {
        playerStates.delete(guildId)
        liveMessages.delete(guildId)
      })
    },
  }

  // ─── Music button handler ──────────────────────────────────────────────────
  client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return
    const cid = interaction.customId
    if (!cid.startsWith('music_')) return
    await interaction.deferUpdate().catch(() => {})
    const guildId = interaction.guild?.id
    if (!guildId || !client.music) return
    if (cid === 'music_toggle') await client.music.pause(guildId)
    else if (cid === 'music_skip')    await client.music.skip(guildId)
    else if (cid === 'music_stop')    await client.music.stop(guildId)
    else if (cid === 'music_shuffle') await client.music.shuffle(guildId)
    else if (cid === 'music_loop') {
      const state = getState(guildId)
      const next = state.loop === 'none' ? 'track' : state.loop === 'track' ? 'queue' : 'none'
      client.music.setLoop(guildId, next)
    }
    // Update the message
    const live = liveMessages.get(guildId)
    if (live) {
      const ch = client.channels.cache.get(live.channelId)
      const msg = ch ? await ch.messages.fetch(live.messageId).catch(() => null) : null
      if (msg) {
        const state = getState(guildId)
        const embed = state.currentTrack ? buildNowPlayingEmbed(client, guildId, state.currentTrack, state) : new EmbedBuilder().setDescription('⏹️ No hay música.')
        const row   = state.currentTrack ? buildMusicButtons(guildId, state) : new ActionRowBuilder()
        await msg.edit({ embeds: [embed], components: state.currentTrack ? [row] : [] }).catch(() => {})
      }
    }
  })

  console.log('[Music] Sistema Shoukaku inicializado'.green)
}
