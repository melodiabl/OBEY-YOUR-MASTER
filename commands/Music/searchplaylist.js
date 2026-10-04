const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'searchplaylist', category: 'Music',
  aliases: ["spl"],
  description: 'Busca playlists',
  usage: 'searchplaylist',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('searchplaylist'),
}
