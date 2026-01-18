const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la musica'),
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', ephemeral: true })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.reply({ content: 'El sistema de musica no esta inicializado.', ephemeral: true })

      await music.pause({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
      return interaction.reply('Musica pausada.')
    } catch (e) {
      return interaction.reply({ content: e?.message || String(e || 'Error desconocido.'), ephemeral: true })
    }
  }
}
