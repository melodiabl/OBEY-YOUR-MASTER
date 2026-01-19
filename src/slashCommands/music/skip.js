const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

module.exports = {
  REGISTER: false,
  CMD: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la cancion actual'),
  DEFER: true,
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.editReply({ content: 'Debes estar en un canal de voz.' })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.editReply('El sistema de musica no esta inicializado.')

      const res = await music.skip({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        force: true
      })
      if (res.ended) return interaction.editReply('⏭️ Cancion saltada. La cola termino.')
      return interaction.editReply(`⏭️ Cancion saltada. Ahora: **${res.skippedTo.title}**`)
    } catch (e) {
      return interaction.editReply(e?.message || String(e || 'Error desconocido.'))
    }
  }
}
