const { runSeek } = require('../../handlers/music/seek-command')
module.exports = {
  name: 'rewind', description: 'Retrocede la cancion X segundos',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ Integer: { name: 'segundos', description: 'Segundos a retroceder (default 10)', required: false } }],
  run: (client, interaction) => runSeek(client, interaction, { action: 'rewind', input: interaction.options.getInteger('segundos'), slash: true }),
}
