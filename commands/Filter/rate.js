const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'rate', category: 'Filter',
  aliases: [],
  description: 'Cambia el rate (usa /filter)',
  usage: 'rate',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('rate'),
}
