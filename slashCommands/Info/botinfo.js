const { runBotInfo } = require('../../handlers/project/bot-info')
module.exports = {
  name: 'botinfo', description: 'Envía información detallada sobre el cliente',
  run: (client, interaction, cmduser, style, locale) => runBotInfo(client, interaction, { slash: true, style, locale }),
}
