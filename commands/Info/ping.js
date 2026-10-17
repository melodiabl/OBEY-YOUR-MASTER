const { runPing } = require('../../handlers/project/ping')
module.exports = {
  name: 'ping', category: 'Info', aliases: ['latency'], cooldown: 2, usage: 'ping', type: 'bot',
  description: 'Muestra la latencia de respuesta, Discord y voz',
  run: (client, message) => runPing(client, message, { style: client.settings?.get?.(message.guild?.id, 'embed') }),
}
