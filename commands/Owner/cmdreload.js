const { runRetiredCommandReload } = require('../../handlers/retired-command-reload')
module.exports = {
  name: 'cmdreload', category: 'Owner', type: 'info', aliases: ['commandreload'],
  description: 'Retired hot reload: use a code deployment or a confirmed restart', usage: 'cmdreload <CMD>',
  run: (client, message, args) => runRetiredCommandReload(client, message, args, 'single'),
}
