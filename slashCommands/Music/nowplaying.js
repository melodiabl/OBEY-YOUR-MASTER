const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'nowplaying', description: 'Muestra la cancion que se esta reproduciendo ahora',
  parameters: { type: 'music', activeplayer: false, previoussong: false }, options: [],
  run: async (client, interaction) => {
    await interaction.deferReply()
    const state = client.music?.getState(interaction.guild.id)
    if (!state?.currentTrack)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x4f545c).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay música reproduciéndose ahora mismo.'), 4096))] })
    // Trigger a fresh NP panel in the music channel
    await client.music.sendNowPlaying(interaction.guild.id, state.currentTrack)
    // Confirm with ephemeral embed
    const info = state.currentTrack?.info || state.currentTrack
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
      .setDescription(obeyUi.limit(`${obeyUi.markup("icon.music")} Panel de **${info?.title || '?'}** actualizado en el canal de música.`, 4096))] })
  },
}
