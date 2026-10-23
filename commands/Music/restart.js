const { runSeek } = require('../../handlers/music/seek-command')
module.exports = {
  name: 'restart', category: 'Music',
  aliases: ['replay', 'beginning'],
  description: 'Reinicia la canción actual desde el principio',
  usage: 'restart',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: (client, message, args = []) => runSeek(client, message, { action: 'restart', input: args[0] }),
}
