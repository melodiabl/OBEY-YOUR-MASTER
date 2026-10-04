const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playsc', category: 'Music',
  aliases: ["psc"],
  description: 'Reproduce en SoundCloud',
  usage: 'playsc',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('playsc'),
}
