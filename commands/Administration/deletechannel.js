const { runChannelDeletion } = require('../../src/modules/moderation/discord/resource-deletion-commands')
module.exports = {
  name: 'deletechannel', category: 'Administration', aliases: ['deletech'],
  description: 'Elimina un canal', usage: 'deletechannel [#canal]', type: 'channel',
  memberpermissions: ['Administrador'], run: runChannelDeletion,
}
