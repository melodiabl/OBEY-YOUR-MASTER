const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'equalizer', category: 'Filter',
  aliases: ["eq"],
  description: 'Ecualizador (usa /filter)',
  usage: 'equalizer',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('equalizer'),
}
