const { runPlaybackControl } = require("../../bot/modulos/musica/comandos/controlar")
module.exports = {
  name: 'pause', description: 'Pausa la musica',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: (client, interaction) => runPlaybackControl(client, interaction, { action: 'pause', slash: true }),
}
