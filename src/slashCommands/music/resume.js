const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

module.exports = {
  REGISTER: false,
  CMD: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Reanuda la musica'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('El sistema de musica no esta inicializado.')

      await music.resume({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
      return interaction.editReply('▶️ Musica reanudada.')
    } catch (e) {
      return interaction.editReply(e?.message || String(e || 'Error desconocido.'))
    }
  }
}
