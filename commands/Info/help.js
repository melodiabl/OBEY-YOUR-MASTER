const { openHelp } = require('../../handlers/helpui')
module.exports = {
  name: 'help', category: 'Info', cooldown: 3,
  aliases: ['h', 'helpmenu', 'menu', 'ayuda', 'comandos', 'halp', 'hilfe', 'commandinfo'],
  description: 'Ayuda contextual con los comandos disponibles y sus requisitos',
  usage: 'help [comando]',
  run: (client, message, args) => openHelp(client, message, (args || []).join(' ')),
}
