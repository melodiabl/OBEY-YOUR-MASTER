const { runPlaybackControl } = require('../../handlers/music/responses')
module.exports = {
  name: 'resume', category: 'Music',
  aliases: ['unpause', 'continue'],
  description: 'Reanuda la reproducción',
  usage: 'resume',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: (client, message) => runPlaybackControl(client, message, { action: 'resume' }),
}
