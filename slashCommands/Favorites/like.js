const { EmbedBuilder } = require('discord.js')
const { toggleLike, buildLikeEmbed } = require('../../handlers/music/likes')

module.exports = {
  name: 'like',
  description: 'Marca o quita de favoritos la canción que suena ahora',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [],
  run: async (client, interaction) => {
    await interaction.deferReply()
    const state = client.music?.getState(interaction.guild.id)
    if (!state?.currentTrack) {
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x4f545c).setDescription('❌ No hay música reproduciéndose ahora mismo.')] })
    }
    const res = await toggleLike(interaction.user.id, state.currentTrack)
    if (!res) {
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Ocurrió un error al procesar tu favorito.')] })
    }
    return interaction.editReply({ embeds: [buildLikeEmbed(res)] })
  },
}
