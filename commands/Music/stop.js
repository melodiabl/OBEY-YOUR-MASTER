const { runPlaybackControl } = require("../../bot/modulos/musica/comandos/controlar")
module.exports = {
  name: 'stop', category: 'Music',
  aliases: ['leave', 'disconnect', 'dis', 'votestop'],
  description: 'Detiene la música y desconecta el bot',
  usage: 'stop',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  run: (client, message) => runPlaybackControl(client, message, { action: 'stop' }),
}
