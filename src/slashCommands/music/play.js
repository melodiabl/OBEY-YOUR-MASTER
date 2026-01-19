const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { botHasVoicePerms, isSoundCloudUrl } = require('../../utils/voiceChecks')
const { formatDuration } = require('../../utils/timeFormat')

module.exports = {
  REGISTER: false,
  CMD: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce musica en tu canal de voz (YouTube / Spotify)')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Enlace o busqueda')
        .setRequired(true)
    ),
  DEFER: true,
  async execute (client, interaction) {
    const query = interaction.options.getString('query', true).trim()
    if (isSoundCloudUrl(query)) {
      return interaction.editReply({ content: '❌ SoundCloud no esta soportado. Usa YouTube o Spotify.' })
    }

    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: '❌ Debes estar en un canal de voz.' })
    }

    const me = interaction.guild.members.me || interaction.guild.members.cache.get(client.user.id)
    const { ok: canJoin } = botHasVoicePerms(voiceChannel, me)
    if (!canJoin) {
      return interaction.editReply({ content: '❌ No tengo permisos para unirme o hablar en ese canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('❌ El sistema de musica no esta inicializado.')

      const res = await music.play({
        guildId: interaction.guild.id,
        guild: interaction.guild,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channelId,
        requestedBy: interaction.user,
        query
      })

      if (res.isPlaylist) {
        const embed = new EmbedBuilder()
          .setTitle('🎶 Lista de reproducción agregada')
          .setDescription(`Se han agregado **${res.trackCount}** canciones de la lista **${res.playlistName || 'Desconocida'}**`)
          .setColor('#5865F2')
          .setTimestamp()
        return interaction.editReply({ embeds: [embed] })
      }

      const { track } = res
      const embed = new EmbedBuilder()
        .setTitle(res.started ? '🎶 Reproduciendo ahora' : '➕ Agregado a la cola')
        .setDescription(`[${track.title}](${track.uri})`)
        .addFields(
          { name: '👤 Autor', value: `\`${track.author}\``, inline: true },
          { name: '⏳ Duración', value: `\`${formatDuration(track.duration)}\``, inline: true },
          { name: '👤 Pedido por', value: `<@${track.requestedBy.id}>`, inline: true }
        )
        .setColor(res.started ? '#00FF00' : '#FFFF00')
        .setTimestamp()

      if (track.thumbnail) embed.setThumbnail(track.thumbnail)

      return interaction.editReply({ embeds: [embed] })
    } catch (e) {
      return interaction.editReply(`❌ No pude procesar tu solicitud: ${e?.message || e}`)
    }
  }
}
