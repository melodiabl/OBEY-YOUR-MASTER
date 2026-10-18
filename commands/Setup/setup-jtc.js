const { openJtcSetup } = require('../../handlers/setup-voice-resources')
module.exports = {
  name: "setup-jtc",
  category: "Setup",
  aliases: ["setup-jointocreate", "setupjtc", "setupjointocreate", "jtc-setup", "jtcsetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  description: 'Configura salas temporales con formularios y acciones confirmadas.',
  usage: 'setup-jtc',
  run: (client, message) => openJtcSetup(client, message),
}
