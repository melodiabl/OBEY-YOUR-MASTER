const { runSlashRemoval } = require('../../src/modules/moderation')

module.exports = {
  name: 'unwarn',
  description: 'Eliminar una advertencia por número de caso',
  memberpermissions: ['KickMembers'],
  options: [
    { Integer: { name: 'caso', description: 'Número del caso a eliminar (ver con /moderation cases)', required: true } },
    { String:  { name: 'razon', description: 'Razón de la eliminación', required: false } },
  ],

  run: runSlashRemoval,
}
