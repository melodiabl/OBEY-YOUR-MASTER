const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playmusicmix', category: 'Music',
  aliases: ["pmm","mix"],
  description: 'Reproduce un mix de música',
  usage: 'playmusicmix',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('playmusicmix'),
}
