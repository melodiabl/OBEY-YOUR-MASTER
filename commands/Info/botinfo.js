const { runBotInfo } = require('../../handlers/project/bot-info')
module.exports = {
  name: 'botinfo', aliases: ['info', 'about', 'stats', 'infobot'], category: 'Info',
  description: 'Muestra información y estado del bot', usage: 'botinfo', type: 'bot',
  run: (client, message) => runBotInfo(client, message, { style: client.settings?.get?.(message.guild?.id, 'embed') }),
}
