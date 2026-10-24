const { changeGuildPrefix } = require('../../handlers/prefix-command')
module.exports = {
  name: 'prefix',
  description: 'Cambiar el prefijo del bot en este servidor',
  memberpermissions: ['Administrator'],
  options: [{ String: { name: 'prefijo', description: 'Nuevo prefijo (máx. 5 caracteres)', required: true } }],
  run: (client, interaction) => changeGuildPrefix(client, interaction, interaction.options.getString('prefijo'), true),
}
