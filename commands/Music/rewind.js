const { runSeek } = require('../../handlers/music/seek-command')
module.exports = {
  name: 'rewind', category: 'Music',
  aliases: ['rw'],
  description: 'Retrocede N segundos en la canción actual',
  usage: 'rewind <segundos>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: (client, message, args = []) => runSeek(client, message, { action: 'rewind', input: args[0] }),
}
