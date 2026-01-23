const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { botHasVoicePerms, isSoundCloudUrl } = require('../../utils/voiceChecks')
const Format = require('../../utils/formatter')
const { replyError, replyOk } = require('../../core/ui/interactionKit')

function isSpotifyPlaylist (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.startsWith('spotify:playlist:')) return true
  if (q.includes('open.spotify.com/playlist/')) return true
  if (q.includes('open.spotify.com/intl-') && q.includes('/playlist/')) return true
  return q.startsWith('https://spotify.link/') ||
    q.startsWith('http://spotify.link/') ||
    q.startsWith('https://spotify.app.link/') ||
    q.startsWith('http://spotify.app.link/')
}

function isYoutubePlaylist (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.includes('youtube.com/playlist')) return true
  if (q.includes('youtube.com/watch') && q.includes('list=')) return true
  if (q.includes('youtu.be/') && q.includes('list=')) return true
  return false
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
        if (seg[0]?.startsWith('intl-') && ['album', 'playlist', 'track'].includes(seg[1]) && seg[2]) {
          u.pathname = `/${seg[1]}/${seg[2]}`
          return u.toString()
        }
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

module.exports = {
  REGISTER: true,
  CMD: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Reproduce una playlist (YouTube / Spotify)')
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('Link/URI de la playlist')
        .setRequired(true)
    ),
  DEFER: true,
  async execute (client, interaction) {
    const query = normalizeMediaQuery(interaction.options.getString('url', true))

    if (isSoundCloudUrl(query)) {
      return replyError(client, interaction, { system: 'music', reason: 'SoundCloud no está soportado. Usa YouTube o Spotify.' })
    }

    if (!isSpotifyPlaylist(query) && !isYoutubePlaylist(query)) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'Debes usar un link/URI de playlist (YouTube o Spotify).',
        hint: 'Ejemplos: `...list=...`, `open.spotify.com/playlist/...`, `spotify:playlist:...`, `spotify.link/...`.'
      })
    }

    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return replyError(client, interaction, { system: 'music', reason: 'Debes estar en un canal de voz.' })
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) {
      return replyError(client, interaction, { system: 'music', reason: 'No tengo permisos para unirme o hablar en ese canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return replyError(client, interaction, { system: 'music', reason: 'El sistema de música no está inicializado.' })

      const res = await music.play({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channelId,
        requestedBy: interaction.user,
        query
      })

      if (res.isPlaylist) {
        const embed = new EmbedBuilder()
          .setTitle(Format.title('📑', 'Playlist agregada'))
          .setDescription(`Se han agregado ${Format.bold(res.trackCount)} canciones de la playlist ${Format.inlineCode(res.playlistName || 'Desconocida')}`)
          .setColor('#5865F2')
          .setTimestamp()
        return interaction.editReply({ embeds: [embed] })
      }

      return replyOk(client, interaction, {
        system: 'music',
        title: 'Reproduciendo',
        lines: [Format.bold(res.track.title)]
      })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'music',
        reason: 'No pude procesar la playlist.',
        hint: `Detalle: ${Format.inlineCode(e?.message || e)}`
      })
    }
  }
}
