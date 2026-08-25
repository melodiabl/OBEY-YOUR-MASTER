const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'pause', description: 'Pausa la musica',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debes estar en un canal de voz.')], ephemeral: true })
    await interaction.deferReply()
    const state = client.music?.getState(interaction.guild.id)
    if (state?.paused)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription('⏸️ Ya está pausado — usa `/music resume` para reanudar.')] })
    const track = state?.currentTrack?.info || state?.currentTrack
    await client.music?.pause(interaction.guild.id)
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFEE75C)
      .setTitle('⏸️ Pausado')
      .setDescription(track ? `**${track.title || '?'}** — pausada.` : 'Música pausada.')
      .setThumbnail(track?.artworkUrl || undefined)] })
  },
}
