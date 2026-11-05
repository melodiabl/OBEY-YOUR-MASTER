const { runPlaybackControl } = require('../../handlers/music/responses')
module.exports = {
  name: 'pause', description: 'Pausa la musica',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: (client, interaction) => runPlaybackControl(client, interaction, { action: 'pause', slash: true }),
}
