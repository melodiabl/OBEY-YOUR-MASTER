const { openAntiNukeSetup } = require('../../handlers/setup-advanced-security')
module.exports = {
  name: "setup-antinuke",
  category: "Setup",
  aliases: ["setupantinuke", "antinuke-setup", "antinukesetup", "antinukesystem"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  description: 'Configura antinuke con preferencias y controles de sesión.',
  usage: 'setup-antinuke',
  run: (client, message) => openAntiNukeSetup(client, message),
}
