const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'pitch', category: 'Filter',
  aliases: ["p"],
  description: 'Cambia el pitch (usa /filter)',
  usage: 'pitch',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('pitch'),
}
