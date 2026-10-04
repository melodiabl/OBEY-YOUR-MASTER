const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playsongoftheday', category: 'Music',
  aliases: ["sotd"],
  description: 'Canción del día',
  usage: 'playsongoftheday',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('playsongoftheday'),
}
