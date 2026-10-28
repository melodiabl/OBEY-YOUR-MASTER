const { runDjRoleCommand } = require('../../handlers/dj-role-command')
module.exports = {
  name: 'removedj', aliases: ['deletedj'], category: 'Settings', memberpermissions: ['Administrator'],
  description: 'Retira un rol de la lista DJ', usage: 'removedj @rol', type: 'music',
  run: (client, message, args) => runDjRoleCommand(client, message, args, 'remove'),
}
