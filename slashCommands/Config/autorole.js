const { configureRoles } = require('../../handlers/configuration-roles')
module.exports = {
  name: 'autorole',
  description: 'Añadir o quitar un rol que se da automáticamente al entrar',
  memberpermissions: ['ManageGuild'],
  options: [
    {
      StringChoices: {
        name: 'accion',
        description: '¿Qué hacer?',
        required: true,
        choices: [
          ['Añadir rol',    'add'],
          ['Quitar rol',    'remove'],
          ['Ver lista',     'list'],
          ['Limpiar todos', 'clear'],
        ],
      },
    },
    { Role: { name: 'rol', description: 'Rol a añadir/quitar del autorole', required: false } },
  ],

  run: (client, interaction) => configureRoles(client, interaction, 'autorole'),
}
