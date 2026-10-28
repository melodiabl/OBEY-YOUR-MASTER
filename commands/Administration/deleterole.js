const { runRoleDeletion } = require('../../src/modules/moderation/discord/resource-deletion-commands')
module.exports = {
  name: 'deleterole', category: 'Administration', aliases: ['roledelete', 'delete-role', 'role-delete'],
  cooldown: 4, description: 'Elimina un rol tras confirmar', usage: 'deleterole @rol',
  type: 'role', run: runRoleDeletion,
}
