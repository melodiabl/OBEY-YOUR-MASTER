const { runPlaybackControl } = require("../../bot/modulos/musica/comandos/controlar")
module.exports = {
  name: 'pause', category: 'Music',
  aliases: ['break'],
  description: 'Pausa la reproducción',
  usage: 'pause',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: (client, message) => runPlaybackControl(client, message, { action: 'pause' }),
}
