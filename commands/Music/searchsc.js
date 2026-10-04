const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'searchsc', category: 'Music',
  aliases: ["ssc"],
  description: 'Busca en SoundCloud',
  usage: 'searchsc',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('searchsc'),
}
