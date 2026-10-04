const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'speed', category: 'Filter',
  aliases: ["sp"],
  description: 'Cambia la velocidad (usa /filter)',
  usage: 'speed',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('speed'),
}
