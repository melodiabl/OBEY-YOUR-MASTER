const { runPing } = require('../../handlers/project/ping')
module.exports = {
  name: 'ping', description: 'Te da información sobre qué tan rápido el Bot puede responderte',
  run: (client, interaction, cmduser, style, locale) => runPing(client, interaction, { slash: true, style, locale }),
}
