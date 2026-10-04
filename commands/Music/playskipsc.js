const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playskipsc', category: 'Music',
  aliases: ["pssc"],
  description: 'Play+skip en SoundCloud',
  usage: 'playskipsc',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('playskipsc'),
}
