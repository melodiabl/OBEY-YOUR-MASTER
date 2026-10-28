const { runBotChannelCommand } = require('../../handlers/bot-channel-command')
module.exports = {
  name: 'addbotchat', aliases: ['addbotchannel'], category: 'Settings',
  description: 'Permite comandos en un canal', usage: 'addbotchat #canal',
  memberpermissions: ['Administrator'], type: 'bot',
  run: (client, message, args) => runBotChannelCommand(client, message, args, 'add'),
}
