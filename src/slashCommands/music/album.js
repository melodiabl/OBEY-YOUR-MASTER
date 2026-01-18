const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { botHasVoicePerms, isSoundCloudUrl } = require('../../utils/voiceChecks')

function isSpotifyAlbum (input) {
  const q = String(input || '').trim().toLowerCase()
  return q.includes('open.spotify.com/album') || q.startsWith('spotify:album:')
}

function isUrlLike (input) {
  return /^https?:\/\//i.test(String(input || '').trim())
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
    const query = interaction.options.getString('query', true).trim()

    if (isSoundCloudUrl(query)) {
      return interaction.editReply({ content: 'SoundCloud no está soportado. Usa Spotify.' })
    }

    if (isUrlLike(query) && !isSpotifyAlbum(query)) {
      return interaction.editReply({
        content: 'Debes usar un link/URI de álbum de Spotify (ej: `https://open.spotify.com/album/...` o `spotify:album:...`).'
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
