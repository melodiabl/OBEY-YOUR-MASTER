const { runSeek } = require('../../handlers/music/seek-command')
module.exports = {
  name: 'forward', category: 'Music',
  aliases: ['ff'],
  description: 'Avanza N segundos en la canción actual',
  usage: 'forward <segundos>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: (client, message, args = []) => runSeek(client, message, { action: 'forward', input: args[0] }),
}
