const { runBotChannelCommand } = require('../../handlers/bot-channel-command')
module.exports = {
  name: 'removebotchat', aliases: ['removebotchat'], category: 'Settings',
  description: 'Retira un canal de la lista de comandos permitidos', usage: 'removebotchat #canal',
  memberpermissions: ['Administrator'], type: 'bot',
  run: (client, message, args) => runBotChannelCommand(client, message, args, 'remove'),
}
