const { openEpicVerificationSetup } = require('../../handlers/setup-advanced-security')
module.exports = {
  name: "setup-epicgamesverify",
  category: "Setup",
  aliases: ["setupepicgamesverify", "epicgamesverify-setup", "epicgamesverifysetup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "info",
  description: 'Configura epicgamesverify con preferencias y controles de sesión.',
  usage: 'setup-epicgamesverify',
  run: (client, message) => openEpicVerificationSetup(client, message),
}
