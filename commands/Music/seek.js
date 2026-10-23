const { runSeek } = require('../../handlers/music/seek-command')
module.exports = {
  name: 'seek', category: 'Music',
  aliases: [],
  description: 'Salta al tiempo indicado (mm:ss o segundos)',
  usage: 'seek <tiempo>',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: (client, message, args = []) => runSeek(client, message, { action: 'seek', input: args[0] }),
}
