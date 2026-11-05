const { runPlaybackControl } = require('../../handlers/music/responses')
module.exports = {
  name: 'resume', description: 'Reanuda la musica pausada',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: (client, interaction) => runPlaybackControl(client, interaction, { action: 'resume', slash: true }),
}
