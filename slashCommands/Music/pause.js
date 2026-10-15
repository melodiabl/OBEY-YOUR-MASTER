const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'pause', description: 'Pausa la musica',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Debes estar en un canal de voz.'), 4096))], ephemeral: true })
    await interaction.deferReply()
    const state = client.music?.getState(interaction.guild.id)
    if (state?.paused)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFEE75C).setDescription(obeyUi.limit(obeyUi.owned('⏸️ Ya está pausado — usa `/music resume` para reanudar.'), 4096))] })
    const track = state?.currentTrack?.info || state?.currentTrack
    await client.music?.pause(interaction.guild.id)
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xFEE75C)
      .setTitle(obeyUi.limit('⏸️ Pausado', 256))
      .setDescription(obeyUi.limit(track ? `**${track.title || '?'}** — pausada.` : 'Música pausada.', 4096))
      .setThumbnail(track?.artworkUrl || undefined)] })
  },
}
