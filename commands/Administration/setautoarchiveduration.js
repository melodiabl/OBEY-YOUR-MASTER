const { runPrefixThreadSettings } = require('../../src/modules/moderation/discord/thread-settings-commands')

module.exports = {
  name: 'setautoarchiveduration', category: 'Administration', aliases: ['setautoarchivecooldown', 'archiveduration', 'archivecooldown'],
  description: 'Cambia la duración de autoarchivo de un hilo', usage: 'setautoarchiveduration <minutos> [#hilo]', type: 'thread',
  run: (client, message, args) => runPrefixThreadSettings(client, message, args, 'setautoarchiveduration'),
}
