const { runRetiredCommandReload } = require('../../handlers/retired-command-reload')
module.exports = {
  name: 'reloadallcmds', category: 'Owner', type: 'info', aliases: ['reloadallcommands'],
  description: 'Retired hot reload: use a code deployment or a confirmed restart', usage: 'reloadallcmds',
  run: (client, message, args) => runRetiredCommandReload(client, message, args, 'all'),
}
