const { runPrefixRoleMute } = require('../../src/modules/moderation')

module.exports = {
  name: 'unmute', category: 'Administration', aliases: [''], cooldown: 4,
  usage: 'unmute @Usuario [razón]',
  description: 'Retira un silencio por rol o timeout.', type: 'member',
  run: (client, message, args) => runPrefixRoleMute(client, message, args, 'unmute'),
}
