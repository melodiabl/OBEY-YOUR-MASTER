const { SlashCommandBuilder } = require('discord.js')
const { getPlayer } = require('../../music/player')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de canciones'),
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', ephemeral: true })
    }

    const player = getPlayer(client)
    const queue = player?.nodes?.get(interaction.guild.id)
    if (!queue) return interaction.reply({ content: 'No hay cola activa.', ephemeral: true })
    if (queue.channel && voiceChannel.id !== queue.channel.id) {
      return interaction.reply({ content: 'Debes estar en el mismo canal de voz que el bot.', ephemeral: true })
    }

    const current = queue.currentTrack
    const upcoming = queue.tracks.toArray().slice(0, 10)
    if (!current && upcoming.length === 0) return interaction.reply({ content: 'No hay canciones en la cola.', ephemeral: true })

    let text = '**Cola:**\n'
    if (current) text += `Ahora: **${current.title}**\n`
    if (upcoming.length) {
      text += '\n**Siguientes:**\n'
      text += upcoming.map((t, i) => `${i + 1}. ${t.title}`).join('\n')
    }

    return interaction.reply(text)
  }
}
