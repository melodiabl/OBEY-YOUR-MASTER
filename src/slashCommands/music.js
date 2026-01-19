const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../music')
const { botHasVoicePerms, isSoundCloudUrl } = require('../utils/voiceChecks')
const { formatDuration } = require('../utils/timeFormat')

function isUrlLike (input) {
  return /^https?:\/\//i.test(String(input || '').trim())
}

function normalizeMediaQuery (input) {
  const raw = String(input || '').trim()
  if (!raw) return raw

  const spotifyUri = raw.match(/\bspotify:(album|playlist|track):[a-z0-9]+\b/i)
  if (spotifyUri) return spotifyUri[0]

  const url = raw.match(/https?:\/\/\S+/i)
  if (url) {
    const cleaned = url[0].replace(/[)\]>,.;]+$/g, '')
    try {
      const u = new URL(cleaned)
      if (u.hostname === 'open.spotify.com') {
        const seg = u.pathname.split('/').filter(Boolean)
        // https://open.spotify.com/intl-es/album/<id>
        if (seg[0]?.startsWith('intl-') && ['album', 'playlist', 'track'].includes(seg[1]) && seg[2]) {
          u.pathname = `/${seg[1]}/${seg[2]}`
          return u.toString()
        }
        // https://open.spotify.com/embed/album/<id>
        if (seg[0] === 'embed' && ['album', 'playlist', 'track'].includes(seg[1]) && seg[2]) {
          u.pathname = `/${seg[1]}/${seg[2]}`
          return u.toString()
        }
      }
    } catch {}
    return cleaned
  }

  return raw
}

function isSpotifyShortLink (input) {
  const q = String(input || '').trim().toLowerCase()
  return q.startsWith('https://spotify.link/') ||
    q.startsWith('http://spotify.link/') ||
    q.startsWith('https://spotify.app.link/') ||
    q.startsWith('http://spotify.app.link/')
}

function isSpotifyAlbum (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.startsWith('spotify:album:')) return true
  if (q.includes('open.spotify.com/album/')) return true
  if (q.includes('open.spotify.com/intl-') && q.includes('/album/')) return true
  return isSpotifyShortLink(q)
}

function isSpotifyPlaylist (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.startsWith('spotify:playlist:')) return true
  if (q.includes('open.spotify.com/playlist/')) return true
  if (q.includes('open.spotify.com/intl-') && q.includes('/playlist/')) return true
  return isSpotifyShortLink(q)
}

function isYoutubePlaylist (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.includes('youtube.com/playlist')) return true
  if (q.includes('youtube.com/watch') && q.includes('list=')) return true
  if (q.includes('youtu.be/') && q.includes('list=')) return true
  return false
}

function createProgressBar (current, total, size = 15) {
  if (!total || total <= 0) return '`───────────────` 0%'
  const progress = Math.max(0, Math.min(size, Math.round((size * current) / total)))
  const empty = size - progress
  const progressText = '█'.repeat(progress)
  const emptyText = '─'.repeat(empty)
  const pct = Math.max(0, Math.min(100, Math.round((current / total) * 100)))
  return `\`${progressText}${emptyText}\` ${pct}%`
}

function parseTimeToMs (timeStr) {
  if (!timeStr) return null
  const t = String(timeStr).trim()
  if (/^\d+$/.test(t)) return parseInt(t) * 1000

  const parts = t.split(':').reverse()
  let ms = 0
  if (parts[0]) ms += parseInt(parts[0]) * 1000
  if (parts[1]) ms += parseInt(parts[1]) * 60 * 1000
  if (parts[2]) ms += parseInt(parts[2]) * 60 * 60 * 1000
  return ms
}

async function ensureVoice (client, interaction) {
  const voiceChannel = interaction.member.voice?.channel
  if (!voiceChannel) {
    await interaction.editReply({ content: 'Debes estar en un canal de voz.' })
    return null
  }

  const me = interaction.guild.members.me || interaction.guild.members.cache.get(client.user.id)
  const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
  if (!canJoin) {
    await interaction.editReply({ content: 'No tengo permisos para unirme o hablar en ese canal de voz.' })
    return null
  }

  return voiceChannel
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('music')
    .setDescription('Comandos de música')
    .addSubcommand(sub =>
      sub
        .setName('play')
        .setDescription('Reproduce música de YouTube')
        .addStringOption(option =>
          option
            .setName('query')
            .setDescription('Enlace de YouTube o búsqueda')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('album')
        .setDescription('Reproduce una playlist de YouTube como un álbum') // Descripción actualizada
        .addStringOption(option =>
          option
            .setName('query')
            .setDescription('Link de la playlist de YouTube')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('playlist')
        .setDescription('Reproduce una playlist de YouTube')
        .addStringOption(option =>
          option
            .setName('query')
            .setDescription('Link de la playlist de YouTube')
            .setRequired(true)
        )
    )
    // ... (otros subcomandos sin cambios)
    .addSubcommand(sub =>
      sub
        .setName('queue')
        .setDescription('Muestra la cola de canciones')
    )
    .addSubcommand(sub =>
      sub
        .setName('nowplaying')
        .setDescription('Muestra la canción actual')
    )
    .addSubcommand(sub =>
      sub
        .setName('pause')
        .setDescription('Pausa la música')
    )
    .addSubcommand(sub =>
      sub
        .setName('resume')
        .setDescription('Reanuda la música')
    )
    .addSubcommand(sub =>
      sub
        .setName('skip')
        .setDescription('Salta la canción actual')
    )
    .addSubcommand(sub =>
      sub
        .setName('stop')
        .setDescription('Detiene la música y limpia la cola')
    )
    .addSubcommand(sub =>
      sub
        .setName('volume')
        .setDescription('Ajusta el volumen del bot')
        .addIntegerOption(option =>
          option
            .setName('cantidad')
            .setDescription('Nivel de volumen (0-1000)')
            .setMinValue(0)
            .setMaxValue(1000)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('loop')
        .setDescription('Configura el modo de repetición')
        .addStringOption(option =>
          option
            .setName('modo')
            .setDescription('Modo de repetición')
            .setRequired(true)
            .addChoices(
              { name: 'Desactivado', value: 'none' },
              { name: 'Canción actual', value: 'track' },
              { name: 'Cola completa', value: 'queue' }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('shuffle')
        .setDescription('Mezcla la cola')
    )
    .addSubcommand(sub =>
      sub
        .setName('seek')
        .setDescription('Salta a un punto específico de la canción')
        .addStringOption(option =>
          option
            .setName('tiempo')
            .setDescription('Punto al que saltar (ej: 1:30 o 90)')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('clearqueue')
        .setDescription('Limpia la cola (mantiene la actual)')
    ),
  DEFER: true,
  async execute (client, interaction) {
    const sub = interaction.options.getSubcommand(true)

    const music = getMusic(client)
    if (!music) return interaction.editReply('El sistema de música no está inicializado.')

    if (sub === 'play') {
      const query = normalizeMediaQuery(interaction.options.getString('query', true))
      if (isSoundCloudUrl(query)) {
        return interaction.editReply({ content: 'SoundCloud no está soportado.' })
      }

      const voiceChannel = await ensureVoice(client, interaction)
      if (!voiceChannel) return

      try {
        const res = await music.play({
          guildId: interaction.guild.id,
          voiceChannelId: voiceChannel.id,
          textChannelId: interaction.channelId,
          requestedBy: interaction.user,
          query
        })

        if (res.isPlaylist) {
          const embed = new EmbedBuilder()
            .setTitle('📑 Playlist agregada')
            .setDescription(`Se han agregado **${res.trackCount}** canciones de la playlist **${res.playlistName || 'Desconocida'}**`)
            .setColor('#FF0000') // Color de YouTube
            .setTimestamp()
          return interaction.editReply({ embeds: [embed] })
        }

        const { track } = res
        const embed = new EmbedBuilder()
          .setTitle(res.started ? '▶️ Reproduciendo ahora' : '➕ Agregado a la cola')
          .setDescription(`[${track.title}](${track.uri})`)
          .addFields(
            { name: 'Autor', value: `\`${track.author}\``, inline: true },
            { name: 'Duración', value: `\`${formatDuration(track.duration)}\``, inline: true },
            { name: 'Pedido por', value: `<@${track.requestedBy.id}>`, inline: true }
          )
          .setColor(res.started ? '#00FF00' : '#FFFF00')
          .setTimestamp()

        if (track.thumbnail) embed.setThumbnail(track.thumbnail)
        return interaction.editReply({ embeds: [embed] })
      } catch (e) {
        return interaction.editReply(`No pude procesar tu solicitud: ${e?.message || e}`)
      }
    }

    if (sub === 'album') {
      const query = normalizeMediaQuery(interaction.options.getString('query', true))
      const voiceChannel = await ensureVoice(client, interaction)
      if (!voiceChannel) return

      try {
        const res = await music.play({
          guildId: interaction.guild.id,
          voiceChannelId: voiceChannel.id,
          textChannelId: interaction.channelId,
          requestedBy: interaction.user,
          query
        })
        
        // Lógica de Embed enriquecido para /music album
        if (res.isPlaylist) {
          const embed = new EmbedBuilder()
            .setColor('#FF0000') // Color de YouTube
            .setTitle('💿 Álbum/Playlist añadido a la cola')
            .setDescription(`**[${res.playlistName || 'Nombre desconocido'}](${query})**`)
            .setImage(res.track?.thumbnail || null) // Usa la portada del primer track como imagen principal
            .addFields(
              { name: 'Canciones', value: `\`${res.trackCount}\``, inline: true },
              { name: 'Pedido por', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setFooter({ text: 'El audio se reproduce desde YouTube.' })
            .setTimestamp()
          return interaction.editReply({ embeds: [embed] })
        }
        
        // Fallback si se usó /album con un link a una sola canción
        const { track } = res
        const embed = new EmbedBuilder()
          .setTitle(res.started ? '▶️ Reproduciendo ahora' : '➕ Agregado a la cola')
          .setDescription(`[${track.title}](${track.uri})`)
          .setColor(res.started ? '#00FF00' : '#FFFF00')
          .setThumbnail(track.thumbnail)
          .setTimestamp()
        return interaction.editReply({ embeds: [embed] })

      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'playlist') {
      const query = normalizeMediaQuery(interaction.options.getString('query', true))
      if (isSoundCloudUrl(query)) {
        return interaction.editReply({ content: 'SoundCloud no está soportado. Usa YouTube o Spotify.' })
      }
      if (!isSpotifyPlaylist(query) && !isYoutubePlaylist(query)) {
        return interaction.editReply({
          content: 'Debes usar un link/URI de playlist (YouTube `...list=...` o Spotify `open.spotify.com/playlist/...`, `spotify:playlist:...` o `spotify.link/...`).'
        })
      }

      const voiceChannel = await ensureVoice(client, interaction)
      if (!voiceChannel) return

      try {
        const res = await music.play({
          guildId: interaction.guild.id,
          voiceChannelId: voiceChannel.id,
          textChannelId: interaction.channelId,
          requestedBy: interaction.user,
          query
        })

        if (res.isPlaylist) {
          const embed = new EmbedBuilder()
            .setTitle('📑 Playlist agregada')
            .setDescription(`Se han agregado **${res.trackCount}** canciones de la playlist **${res.playlistName || 'Desconocida'}**`)
            .setColor('#5865F2')
            .setTimestamp()
          return interaction.editReply({ embeds: [embed] })
        }

        return interaction.editReply(`Reproduciendo: **${res.track.title}**`)
      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'queue') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })

      try {
        const state = await music.getQueue({ guildId: interaction.guild.id })
        const current = state.currentTrack
        const upcoming = state.queue

        if (!current && upcoming.length === 0) {
          return interaction.editReply('No hay canciones en la cola.')
        }

        const loopLabel = { none: 'Desactivado', track: 'Canción', queue: 'Cola' }
        const embed = new EmbedBuilder()
          .setTitle('🎶 Cola de reproducción')
          .setColor('#5865F2')
          .setTimestamp()

        let description = ''
        if (current) {
          description += `**Ahora reproduciendo:**\n[${current.title}](${current.uri}) | \`${formatDuration(current.duration)}\`\n\n`
        }

        if (upcoming.length > 0) {
          description += '**Siguientes en la cola:**\n'
          description += upcoming.slice(0, 10).map((t, i) => `${i + 1}. [${t.title}](${t.uri}) | \`${formatDuration(t.duration)}\``).join('\n')
          if (upcoming.length > 10) {
            description += `\n\n*y ${upcoming.length - 10} canciones más...*`
          }
        } else {
          description += '*No hay canciones siguientes.*'
        }

        embed.setDescription(description)
        embed.addFields(
          { name: 'Volumen', value: `\`${state.volume}%\``, inline: true },
          { name: 'Bucle', value: `\`${loopLabel[state.loop]}\``, inline: true },
          { name: 'Canciones', value: `\`${upcoming.length + (current ? 1 : 0)}\``, inline: true }
        )

        return interaction.editReply({ embeds: [embed] })
      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'nowplaying') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })

      try {
        const state = await music.nowPlaying({ guildId: interaction.guild.id })
        const current = state.currentTrack
        if (!current) return interaction.editReply('No hay música reproduciéndose.')

        const player = music.shoukaku.players.get(interaction.guild.id)
        const position = player ? player.position : 0
        const status = state.isPaused ? '⏸️ Pausado' : '🎶 Reproduciendo'

        const embed = new EmbedBuilder()
          .setTitle(status)
          .setDescription(`[${current.title}](${current.uri})`)
          .addFields(
            { name: 'Autor', value: `\`${current.author}\``, inline: true },
            { name: 'Pedido por', value: `<@${current.requestedBy.id}>`, inline: true },
            { name: 'Tiempo', value: `\`${formatDuration(position)} / ${formatDuration(current.duration)}\``, inline: false },
            { name: 'Progreso', value: createProgressBar(position, current.duration), inline: false }
          )
          .setColor('#5865F2')
          .setTimestamp()

        if (current.thumbnail) embed.setThumbnail(current.thumbnail)
        return interaction.editReply({ embeds: [embed] })
      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'pause') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
      try {
        await music.pause({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
        return interaction.editReply('⏸️ Música pausada.')
      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'resume') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
      try {
        await music.resume({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
        return interaction.editReply('▶️ Música reanudada.')
      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'skip') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
      try {
        const res = await music.skip({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id, force: true })
        if (res.ended) return interaction.editReply('⏭️ Canción saltada. La cola terminó.')
        return interaction.editReply(`⏭️ Canción saltada. Ahora: **${res.skippedTo.title}**`)
      } catch (e) {
        return interaction.editReply(e?.message || String(e || 'Error desconocido.'))
      }
    }

    if (sub === 'stop') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
      try {
        await music.stop({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
        return interaction.editReply('⏹️ Música detenida.')
      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'volume') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
      const volume = interaction.options.getInteger('cantidad', true)
      try {
        await music.setVolume({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id, volume })
        return interaction.editReply(`🔊 Volumen ajustado a **${volume}%**`)
      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'loop') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
      const mode = interaction.options.getString('modo', true)
      try {
        await music.setLoop({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id, mode })
        const modeLabels = { none: 'Desactivado', track: 'Canción actual', queue: 'Cola completa' }
        return interaction.editReply(`🔁 Modo de repetición: **${modeLabels[mode]}**`)
      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'shuffle') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
      try {
        const { count } = await music.shuffle({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
        return interaction.editReply(`🔀 Cola mezclada (${count} en cola).`)
      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'seek') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
      const timeStr = interaction.options.getString('tiempo', true)
      const ms = parseTimeToMs(timeStr)
      if (isNaN(ms) || ms === null) {
        return interaction.editReply('Formato de tiempo inválido. Usa segundos (90) o formato 1:30.')
      }

      try {
        const state = await music.nowPlaying({ guildId: interaction.guild.id })
        if (!state.currentTrack) {
          return interaction.editReply('No hay ninguna canción reproduciéndose.')
        }
        if (ms > state.currentTrack.duration) {
          return interaction.editReply('El tiempo especificado excede la duración de la canción.')
        }

        await music.seek({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id, position: ms })
        return interaction.editReply(`⏩ Saltado a **${timeStr}**`)
      } catch (e) {
        return interaction.editReply(`Error: ${e?.message || e}`)
      }
    }

    if (sub === 'clearqueue') {
      const voiceChannel = interaction.member.voice?.channel
      if (!voiceChannel) return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
      try {
        const { cleared, state } = await music.clearQueue({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
        const suffix = state.currentTrack ? ' (la actual se mantiene)' : ''
        return interaction.editReply(`🧹 Cola limpiada: **${cleared}** canciones eliminadas${suffix}.`)
      } catch (e) {
        return interaction.editReply(e?.message || String(e || 'Error desconocido.'))
      }
    }
  }
}
