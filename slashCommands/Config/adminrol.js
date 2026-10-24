const { configureRoles } = require('../../handlers/configuration-roles')
module.exports = {
  name: 'adminrol',
  description: 'Gestionar los roles con acceso a comandos de administración',
  memberpermissions: ['Administrator'],
  options: [
    {
      StringChoices: {
        name: 'accion',
        description: '¿Qué hacer?',
        required: true,
        choices: [
          ['Añadir rol admin',   'add'],
          ['Quitar rol admin',   'remove'],
          ['Ver roles admin',    'list'],
        ],
      },
    },
    { Role: { name: 'rol', description: 'Rol a añadir/quitar', required: false } },
  ],

  run: (client, interaction) => configureRoles(client, interaction, 'admin'),
}
