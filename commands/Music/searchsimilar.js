const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'searchsimilar', category: 'Music',
  aliases: ["ss"],
  description: 'Busca canciones similares',
  usage: 'searchsimilar',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('searchsimilar'),
}
