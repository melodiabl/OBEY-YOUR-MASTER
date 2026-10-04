const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'playlist', category: 'Music',
  aliases: ["pl"],
  description: 'Gestiona playlists guardadas',
  usage: 'playlist',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: require('../../handlers/music/prefix-compat')('playlist'),
}
