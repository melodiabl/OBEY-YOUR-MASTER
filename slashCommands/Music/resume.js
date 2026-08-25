const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'resume', description: 'Reanuda la musica pausada',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debes estar en un canal de voz.')], ephemeral: true })
    await interaction.deferReply()
    const state = client.music?.getState(interaction.guild.id)
    if (!state?.paused)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription('▶️ La música no está pausada.')] })
    const track = state?.currentTrack?.info || state?.currentTrack
    await client.music?.pause(interaction.guild.id)
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x57F287)
      .setTitle('▶️ Reanudado')
      .setDescription(track ? `**${track.title || '?'}** — reanudada.` : 'Música reanudada.')
      .setThumbnail(track?.artworkUrl || undefined)] })
  },
}
