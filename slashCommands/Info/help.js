const { openHelp } = require('../../handlers/helpui')
module.exports = {
  name: 'help', cooldown: 3,
  description: 'Ayuda contextual con los comandos disponibles y sus requisitos',
  options: [{ String: { name: 'comando', description: 'Nombre, alias o comando slash que quieres consultar', required: false } }],
  run: (client, interaction) => openHelp(client, interaction, interaction.options.getString('comando') || '', true),
}
