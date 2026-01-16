const { SlashCommandBuilder } = require('discord.js')
const { getPlayer } = require('../../music/player')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la musica'),
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', ephemeral: true })
    }

    const player = getPlayer(client)
    const queue = player?.nodes?.get(interaction.guild.id)
    if (!queue || !queue.node.isPlaying()) {
      return interaction.reply({ content: 'No hay musica reproduciendose.', ephemeral: true })
    }
    if (queue.channel && voiceChannel.id !== queue.channel.id) {
      return interaction.reply({ content: 'Debes estar en el mismo canal de voz que el bot.', ephemeral: true })
    }
    if (queue.node.isPaused()) {
      return interaction.reply({ content: 'La musica ya esta pausada.', ephemeral: true })
    }

    const ok = queue.node.pause()
    if (!ok) return interaction.reply({ content: 'No se pudo pausar.', ephemeral: true })
    return interaction.reply('Musica pausada.')
  }
}
