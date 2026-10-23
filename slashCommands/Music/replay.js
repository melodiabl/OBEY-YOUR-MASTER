const { runSeek } = require('../../handlers/music/seek-command')
module.exports = {
  name: 'replay', description: 'Reinicia la cancion actual desde el principio',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: (client, interaction) => runSeek(client, interaction, { action: 'restart', input: undefined, slash: true }),
}
