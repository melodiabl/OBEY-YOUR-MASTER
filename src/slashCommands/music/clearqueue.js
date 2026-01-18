const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('clearqueue')
    .setDescription('Limpia la cola de canciones (mantiene la actual)'),
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', ephemeral: true })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.reply({ content: 'El sistema de musica no esta inicializado.', ephemeral: true })

      const { cleared, state } = await music.clearQueue({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
      const suffix = state.currentTrack ? ' (la actual se mantiene)' : ''
      return interaction.reply(`Cola limpiada: **${cleared}** canciones eliminadas${suffix}.`)
    } catch (e) {
      return interaction.reply({ content: e?.message || String(e || 'Error desconocido.'), ephemeral: true })
    }
  }
}
