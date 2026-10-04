const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'addsimilar', category: 'Music',
  aliases: ["similar"],
  description: 'Añade canciones similares',
  usage: 'addsimilar',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('addsimilar'),
}
