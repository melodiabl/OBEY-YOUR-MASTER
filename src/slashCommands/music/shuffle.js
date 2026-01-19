const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

module.exports = {
  REGISTER: false,
  CMD: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Mezcla las canciones de la cola'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel

    if (!voiceChannel) {
      return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('El sistema de musica no esta inicializado.')

      const { count } = await music.shuffle({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id
      })

      if (count < 2) {
        return interaction.editReply('❌ No hay suficientes canciones en la cola para mezclar.')
      }

      return interaction.editReply(`🔀 Se han mezclado **${count}** canciones.`)
    } catch (e) {
      return interaction.editReply(`Error: ${e?.message || e}`)
    }
  }
}
