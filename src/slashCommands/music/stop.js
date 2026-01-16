const { SlashCommandBuilder } = require('discord.js')
const { getPlayer } = require('../../music/player')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la musica y limpia la cola'),
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', ephemeral: true })
    }

    const player = getPlayer(client)
    const queue = player?.nodes?.get(interaction.guild.id)
    if (!queue) return interaction.reply({ content: 'No hay musica reproduciendose.', ephemeral: true })
    if (queue.channel && voiceChannel.id !== queue.channel.id) {
      return interaction.reply({ content: 'Debes estar en el mismo canal de voz que el bot.', ephemeral: true })
    }

    try {
      queue.delete()
      return interaction.reply('Musica detenida y cola borrada.')
    } catch {
      return interaction.reply({ content: 'No se pudo detener la musica.', ephemeral: true })
    }
  }
}
