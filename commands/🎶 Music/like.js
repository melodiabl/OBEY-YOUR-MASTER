const { EmbedBuilder } = require('discord.js')
const { toggleLike, buildLikeEmbed } = require('../../handlers/music/likes')

module.exports = {
  name: 'like',
  category: '🎶 Music',
  aliases: ['fav', 'love'],
  description: 'Marca o quita de favoritos la canción que suena ahora',
  usage: 'like',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state?.currentTrack) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay música reproduciéndose.')] }).catch(() => {})
    }
    const res = await toggleLike(message.author.id, state.currentTrack)
    if (!res) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Ocurrió un error al procesar tu favorito.')] }).catch(() => {})
    }
    return message.reply({ embeds: [buildLikeEmbed(res)] }).catch(() => {})
  },
}
