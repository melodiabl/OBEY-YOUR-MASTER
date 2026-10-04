const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'radio', category: 'Music',
  aliases: ["r"],
  description: 'Reproduce una radio',
  usage: 'radio',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('radio'),
}
