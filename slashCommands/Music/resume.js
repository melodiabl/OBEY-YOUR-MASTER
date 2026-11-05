const { runPlaybackControl } = require("../../bot/modulos/musica/comandos/controlar")
module.exports = {
  name: 'resume', description: 'Reanuda la musica pausada',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: (client, interaction) => runPlaybackControl(client, interaction, { action: 'resume', slash: true }),
}
