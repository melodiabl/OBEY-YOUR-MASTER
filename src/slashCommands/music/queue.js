const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getMusic } = require('../../music')
const { formatDuration } = require('../../utils/timeFormat')

module.exports = {
  REGISTER: false,
  CMD: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de canciones'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: '❌ Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('❌ El sistema de musica no esta inicializado.')

      const state = await music.getQueue({ guildId: interaction.guild.id })
      const current = state.currentTrack
      const upcoming = state.queue

      if (!current && upcoming.length === 0) {
        return interaction.editReply('❌ No hay canciones en la cola.')
      }

      const loopEmoji = { none: '➡️', track: '🔂', queue: '🔁' }
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
        { name: '🔊 Volumen', value: `\`${state.volume}%\``, inline: true },
        { name: `${loopEmoji[state.loop]} Bucle`, value: `\`${loopLabel[state.loop]}\``, inline: true },
        { name: '📄 Canciones', value: `\`${upcoming.length + (current ? 1 : 0)}\``, inline: true }
      )

      return interaction.editReply({ embeds: [embed] })
    } catch (e) {
      return interaction.editReply(`❌ Error: ${e?.message || e}`)
    }
  }
}
