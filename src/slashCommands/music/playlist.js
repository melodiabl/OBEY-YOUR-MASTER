const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { botHasVoicePerms, isSoundCloudUrl } = require('../../utils/voiceChecks')

function isSpotifyPlaylist (input) {
  const q = String(input || '').trim().toLowerCase()
  return q.includes('open.spotify.com/playlist') || q.startsWith('spotify:playlist:')
}

function isYoutubePlaylist (input) {
  const q = String(input || '').trim().toLowerCase()
  if (q.includes('youtube.com/playlist')) return true
  if (q.includes('youtube.com/watch') && q.includes('list=')) return true
  if (q.includes('youtu.be/') && q.includes('list=')) return true
  return false
}

module.exports = {
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
    const query = interaction.options.getString('url', true).trim()

    if (isSoundCloudUrl(query)) {
      return interaction.editReply({ content: 'SoundCloud no está soportado. Usa YouTube o Spotify.' })
    }

    if (!isSpotifyPlaylist(query) && !isYoutubePlaylist(query)) {
      return interaction.editReply({
        content: 'Debes usar un link/URI de playlist (YouTube `...list=...` o Spotify `https://open.spotify.com/playlist/...` / `spotify:playlist:...`).'
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
}
