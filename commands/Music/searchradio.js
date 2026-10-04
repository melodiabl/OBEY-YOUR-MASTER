const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'searchradio', category: 'Music',
  aliases: ["sr"],
  description: 'Busca radios',
  usage: 'searchradio',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('searchradio'),
}
