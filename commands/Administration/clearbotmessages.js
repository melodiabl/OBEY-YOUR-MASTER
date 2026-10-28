const { runPrefixPurge } = require('../../src/modules/moderation/discord/purge-commands')

module.exports = {
  name: 'clearbotmessages', aliases: ['clearbotmsgs', 'purgebotmessages', 'purgebotmsgs', 'prune'],
  category: 'Administration', type: 'channel',
  description: 'Elimina mensajes recientes de OBEY en el canal.',
  usage: 'clearbotmessages [cantidad a revisar]',
  run: (client, message, args) => runPrefixPurge(client, message, args, 'clearbotmessages'),
}
