const { runPlaybackControl } = require('../../handlers/music/responses')
module.exports = {
  name: 'skip', category: 'Music',
  aliases: ['s', 'fs', 'forceskip', 'voteskip', 'vs'],
  description: 'Salta la canción actual',
  usage: 'skip [cantidad]',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: (client, message, args = []) => runPlaybackControl(client, message, { action: 'skip', count: args[0] === undefined ? 1 : Number(args[0]) }),
}
