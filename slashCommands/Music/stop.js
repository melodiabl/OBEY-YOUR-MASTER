const { runPlaybackControl } = require("../../bot/modulos/musica/comandos/controlar")
module.exports = {
  name: 'stop', description: 'Detiene la musica y limpia la cola',
  parameters: { type: 'music', activeplayer: false, previoussong: false }, options: [],
  run: (client, interaction) => runPlaybackControl(client, interaction, { action: 'stop', slash: true }),
}
