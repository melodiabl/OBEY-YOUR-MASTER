const { changeGuildPrefix } = require('../../handlers/prefix-command')
module.exports = {
  name: 'prefix',
  category: 'Settings',
  description: "Let's you change the Prefix of the BOT",
  usage: 'prefix <NEW PREFIX>',
  memberpermissions: ['Administrator'],
  type: 'bot',
  run: (client, message, args) => changeGuildPrefix(client, message, args?.length === 1 ? args[0] : undefined),
}
