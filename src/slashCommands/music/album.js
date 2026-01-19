const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { botHasVoicePerms, isSoundCloudUrl } = require('../../utils/voiceChecks')

function isSpotifyAlbum (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.startsWith('spotify:album:')) return true
  if (q.includes('open.spotify.com/album/')) return true
  if (q.includes('open.spotify.com/intl-') && q.includes('/album/')) return true
  return q.startsWith('https://spotify.link/') ||
    q.startsWith('http://spotify.link/') ||
    q.startsWith('https://spotify.app.link/') ||
    q.startsWith('http://spotify.app.link/')
}

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

async function playAlbum (music, payload) {
  const q = String(payload.query || '').trim()

  if (isSpotifyAlbum(q)) return await music.play(payload)

  // Búsqueda por texto: intentar buscar álbum en Spotify con LavaSrc.
  // Si no está soportado, cae a búsqueda normal.
  try {
    return await music.play({ ...payload, query: `spsearch:album:${q}` })
  } catch (e) {
    try {
      return await music.play({ ...payload, query: `spsearch:${q}` })
    } catch {
      throw e
    }
  }
}

module.exports = {
  REGISTER: false,
  CMD: new SlashCommandBuilder()
    .setName('album')
    .setDescription('Reproduce un álbum (Spotify por link/URI o búsqueda por texto)')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Link/URI del álbum o texto a buscar')
        .setRequired(true)
    ),
  DEFER: true,
  async execute (client, interaction) {
    const query = normalizeMediaQuery(interaction.options.getString('query', true))

    if (isSoundCloudUrl(query)) {
      return interaction.editReply({ content: 'SoundCloud no está soportado. Usa Spotify.' })
    }

    if (isUrlLike(query) && !isSpotifyAlbum(query)) {
      return interaction.editReply({
        content: 'Debes usar un link/URI de álbum de Spotify (también sirve `spotify.link/...`).'
      })
    }

    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) {
      return interaction.editReply({ content: 'No tengo permisos para unirme o hablar en ese canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('El sistema de música no está inicializado.')

      const res = await playAlbum(music, {
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channelId,
        requestedBy: interaction.user,
        query
      })

      if (res.isPlaylist) {
        const embed = new EmbedBuilder()
          .setTitle('💿 Álbum agregado')
          .setDescription(`Se han agregado **${res.trackCount}** canciones del álbum **${res.playlistName || 'Desconocido'}**`)
          .setColor('#5865F2')
          .setTimestamp()
        return interaction.editReply({ embeds: [embed] })
      }

      return interaction.editReply(`Reproduciendo: **${res.track.title}**`)
    } catch (e) {
      return interaction.editReply(`Error: ${e?.message || e}`)
    }
  }
}
