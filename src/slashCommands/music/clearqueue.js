const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Limpia la cola de canciones (mantiene la actual)'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('El sistema de musica no esta inicializado.')

      const { cleared, state } = await music.clearQueue({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
      const suffix = state.currentTrack ? ' (la actual se mantiene)' : ''
      return interaction.editReply(`🗑️ Cola limpiada: **${cleared}** canciones eliminadas${suffix}.`)
    } catch (e) {
      return interaction.editReply(e?.message || String(e || 'Error desconocido.'))
    }
  }
}
