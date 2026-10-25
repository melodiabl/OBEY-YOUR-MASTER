const { runSlashCases } = require('../../src/modules/moderation')
module.exports = {
  name: 'cases',
  description: 'Ver el historial de moderación de un usuario',
  memberpermissions: ['KickMembers'],
  options: [
    { User: { name: 'usuario', description: 'Usuario a consultar', required: true } },
    { Integer: { name: 'pagina', description: 'Página de resultados', required: false } },
  ],
  run: (client, interaction) => runSlashCases(client, interaction),
}
