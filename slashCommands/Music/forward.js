const { runSeek } = require('../../handlers/music/seek-command')
module.exports = {
  name: 'forward', description: 'Avanza la cancion X segundos',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ Integer: { name: 'segundos', description: 'Segundos a avanzar (default 10)', required: false } }],
  run: (client, interaction) => runSeek(client, interaction, { action: 'forward', input: interaction.options.getInteger('segundos'), slash: true }),
}
