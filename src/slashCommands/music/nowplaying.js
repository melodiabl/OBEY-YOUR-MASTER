const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { formatDuration } = require('../../utils/timeFormat')

function createProgressBar (current, total, size = 15) {
  const progress = Math.round((size * current) / total)
  const emptyProgress = size - progress
  const progressText = '▇'.repeat(progress)
  const emptyProgressText = '—'.repeat(emptyProgress)
  const percentage = Math.round((current / total) * 100)
  return `\`${progressText}${emptyProgressText}\` ${percentage}%`
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Muestra la cancion actual'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: '❌ Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('❌ El sistema de musica no esta inicializado.')

      const state = await music.nowPlaying({ guildId: interaction.guild.id })
      const current = state.currentTrack
      if (!current) return interaction.editReply('❌ No hay musica reproduciendose.')

      const player = music.shoukaku.players.get(interaction.guild.id)
      const position = player ? player.position : 0

      const status = state.isPaused ? '⏸️ Pausado' : '🎶 Reproduciendo'
      
      const embed = new EmbedBuilder()
        .setTitle(status)
        .setDescription(`[${current.title}](${current.uri})`)
        .addFields(
          { name: '👤 Autor', value: `\`${current.author}\``, inline: true },
          { name: '👤 Pedido por', value: `<@${current.requestedBy.id}>`, inline: true },
          { name: '⏳ Tiempo', value: `\`${formatDuration(position)} / ${formatDuration(current.duration)}\``, inline: false },
          { name: '📊 Progreso', value: createProgressBar(position, current.duration), inline: false }
        )
        .setColor('#5865F2')
        .setTimestamp()

      if (current.thumbnail) embed.setThumbnail(current.thumbnail)

      return interaction.editReply({ embeds: [embed] })
    } catch (e) {
      return interaction.editReply(`❌ Error: ${e?.message || e}`)
    }
  }
}
