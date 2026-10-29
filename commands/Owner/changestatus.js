const { openBotStatus } = require('../../handlers/bot-status-command')
module.exports = {
  name: 'changestatus', category: 'Owner', type: 'bot', aliases: ['botstatus', 'status'], cooldown: 5,
  usage: 'changestatus', description: 'Configura los textos, la actividad y la disponibilidad del bot con borrador y guardado.',
  run: (client, message) => openBotStatus(client, message),
}
