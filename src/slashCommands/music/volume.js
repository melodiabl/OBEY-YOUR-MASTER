const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

module.exports = {
  REGISTER: false,
  CMD: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta el volumen del bot')
    .addIntegerOption(option =>
      option
        .setName('cantidad')
        .setDescription('Nivel de volumen (0-1000)')
        .setMinValue(0)
        .setMaxValue(1000)
        .setRequired(true)
    ),
  DEFER: true,
  async execute (client, interaction) {
    const volume = interaction.options.getInteger('cantidad', true)
    const voiceChannel = interaction.member.voice?.channel

    if (!voiceChannel) {
      return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('El sistema de musica no esta inicializado.')

      await music.setVolume({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        volume
      })

      return interaction.editReply(`🔊 Volumen ajustado a **${volume}%**`)
    } catch (e) {
      return interaction.editReply(`Error: ${e?.message || e}`)
    }
  }
}
