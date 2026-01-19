const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

module.exports = {
  REGISTER: false,
  CMD: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Configura el modo de repetición')
    .addStringOption(option =>
      option
        .setName('modo')
        .setDescription('Modo de repetición')
        .setRequired(true)
        .addChoices(
          { name: 'Desactivado', value: 'none' },
          { name: 'Canción Actual', value: 'track' },
          { name: 'Cola Completa', value: 'queue' }
        )
    ),
  DEFER: true,
  async execute (client, interaction) {
    const mode = interaction.options.getString('modo', true)
    const voiceChannel = interaction.member.voice?.channel

    if (!voiceChannel) {
      return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('El sistema de musica no esta inicializado.')

      await music.setLoop({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        mode
      })

      const modeLabels = {
        none: 'Desactivado ➡️',
        track: 'Canción Actual 🔂',
        queue: 'Cola Completa 🔁'
      }

      return interaction.editReply(`🔁 Modo de repetición establecido en: **${modeLabels[mode]}**`)
    } catch (e) {
      return interaction.editReply(`Error: ${e?.message || e}`)
    }
  }
}
