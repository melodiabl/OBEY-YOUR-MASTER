const { runSlashPurge } = require('../../src/modules/moderation/discord/purge-commands')

module.exports = {
  name: 'purge', description: 'Eliminar mensajes recientes del canal actual',
  memberpermissions: ['ManageMessages'],
  options: [
    { Integer: { name: 'cantidad', description: 'Cantidad a eliminar (1-99)', required: true } },
    { StringChoices: { name: 'filtro', description: 'Tipo de mensajes', required: false,
      choices: [['Todos', 'all'], ['Solo bots', 'bots'], ['Solo enlaces', 'links'], ['Solo adjuntos', 'attachments']] } },
    { User: { name: 'usuario', description: 'Solo mensajes de este usuario', required: false } },
  ],
  run: runSlashPurge,
}
