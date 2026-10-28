const { runPrefixPurge } = require('../../src/modules/moderation/discord/purge-commands')

module.exports = {
  name: 'clear', aliases: ['purge'], category: 'Administration', type: 'channel',
  description: 'Elimina mensajes recientes; con filtro, la cantidad indica cuántos mensajes revisar.',
  usage: 'clear <cantidad> [@usuario|bots]',
  run: (client, message, args) => runPrefixPurge(client, message, args, 'clear'),
}
