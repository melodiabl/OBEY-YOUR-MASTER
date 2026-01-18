const { SlashCommandBuilder } = require('discord.js')
const { getMusic } = require('../../music')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Muestra la cancion actual'),
  async execute (client, interaction) {
    const voiceChannel = interaction.member.voice?.channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'Debes estar en un canal de voz.', ephemeral: true })
    }

    try {
      const music = getMusic(client)
      if (!music) return interaction.reply({ content: 'El sistema de musica no esta inicializado.', ephemeral: true })

      const state = await music.nowPlaying({ guildId: interaction.guild.id, voiceChannelId: voiceChannel.id })
      const current = state.currentTrack
      if (!current) return interaction.reply({ content: 'No hay musica reproduciendose.', ephemeral: true })

      const status = state.isPaused ? 'Pausado' : (state.isPlaying ? 'Reproduciendo' : 'Detenido')
      const by = current.requestedBy?.tag ? ` (pedido por ${current.requestedBy.tag})` : ''
      return interaction.reply(`${status}: **${current.title}**${by}`)
    } catch (e) {
      return interaction.reply({ content: e?.message || String(e || 'Error desconocido.'), ephemeral: true })
    }
  }
}
