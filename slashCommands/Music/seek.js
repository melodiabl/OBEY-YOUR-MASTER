const { runSeek } = require('../../handlers/music/seek-command')
module.exports = {
  name: 'seek', description: 'Salta a un momento de la cancion',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ String: { name: 'tiempo', description: 'Formato: 1:30 o 90 (segundos)', required: true } }],
  run: (client, interaction) => runSeek(client, interaction, { action: 'seek', input: interaction.options.getString('tiempo'), slash: true }),
}
