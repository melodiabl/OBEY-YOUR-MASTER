const { runDjRoleCommand } = require('../../handlers/dj-role-command')
module.exports = {
  name: 'adddj', aliases: ['adddjrole'], category: 'Settings', memberpermissions: ['Administrator'],
  description: 'Añade un rol a la lista DJ', usage: 'adddj @rol', type: 'music',
  run: (client, message, args) => runDjRoleCommand(client, message, args, 'add'),
}
