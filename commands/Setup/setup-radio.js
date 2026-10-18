const { openRadioSetup } = require('../../handlers/setup-radio-resources')
module.exports = {
  name: "setup-radio",
  category: "Setup",
  aliases: [
        "setupradio",
        "setup-waitingroom",
        "setupwaitingroom",
        "radio-setup",
        "radiosetup",
        "waitingroom-setup",
        "waitingroomsetup",
    ],
  cooldown: 10,
  memberpermissions: ['Administrador'],
  type: "fun",
  description: 'Configura la radio con formularios y acciones confirmadas.',
  usage: 'setup-radio [estación] [volumen]',
  run: (client, message, args = []) => openRadioSetup(client, message, args[0], args[1]),
}
