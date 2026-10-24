const { openVoiceRules } = require('../../handlers/setup-voice-rules')

module.exports = {
  name: "setup-joinlist",
  category: "Setup",
  aliases: ["joinlist", "setupjoinlist", "joinlist-setup", "joinlistsetup"],
  cooldown: 4,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-joinlist',
  description: 'Configura las reglas de entrada con formularios y guardado explícito.',
  run: (client, message) => openVoiceRules(client, message, 'joinlist'),
}
