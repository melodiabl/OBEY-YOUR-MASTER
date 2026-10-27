const { runPrefixBanList } = require('../../src/modules/moderation/discord/ban-list-commands')

module.exports = {
  name: 'bans', category: 'Administration', aliases: ['listbans', 'list-bans'],
  description: 'Consulta la lista de vetos por mensaje privado', usage: 'bans [página]', type: 'server',
  run: (client, message, args) => runPrefixBanList(client, message, args, 'bans'),
}
