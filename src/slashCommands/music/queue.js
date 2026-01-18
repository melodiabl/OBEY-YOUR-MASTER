const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de canciones'),
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', ephemeral: true })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.reply({ content: 'El sistema de musica no esta inicializado.', ephemeral: true })

      const state = await music.getQueue({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
      const current = state.currentTrack
      const upcoming = state.queue.slice(0, 10)
      if (!current && upcoming.length === 0) return interaction.reply({ content: 'No hay canciones en la cola.', ephemeral: true })

      let text = '**Cola:**\n'
      if (current) text += `Ahora: **${current.title}**\n`
      if (upcoming.length) {
        text += '\n**Siguientes:**\n'
        text += upcoming.map((t, i) => `${i + 1}. ${t.title}`).join('\n')
      }

      return interaction.reply(text)
    } catch (e) {
      return interaction.reply({ content: e?.message || String(e || 'Error desconocido.'), ephemeral: true })
    }
  }
}
