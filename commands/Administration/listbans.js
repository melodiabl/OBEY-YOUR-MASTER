const { runPrefixBanList } = require('../../src/modules/moderation/discord/ban-list-commands')

module.exports = {
  name: 'listbans', category: 'Administration', aliases: ['banhammer', 'tempban'],
  description: 'Consulta la lista de vetos por mensaje privado', usage: 'listbans [página]', type: 'server',
  run: (client, message, args) => runPrefixBanList(client, message, args, 'listbans'),
}
