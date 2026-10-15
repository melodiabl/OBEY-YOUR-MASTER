const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const { toggleLike, buildLikeEmbed } = require('../../handlers/music/likes')

module.exports = {
  name: 'like',
  category: 'Music',
  aliases: ['fav', 'love'],
  description: 'Marca o quita de favoritos la canción que suena ahora',
  usage: 'like',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state?.currentTrack) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay música reproduciéndose.'), 4096))] }).catch(() => {})
    }
    const res = await toggleLike(message.author.id, state.currentTrack)
    if (!res) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Ocurrió un error al procesar tu favorito.'), 4096))] }).catch(() => {})
    }
    return message.reply({ embeds: [buildLikeEmbed(res)] }).catch(() => {})
  },
}
