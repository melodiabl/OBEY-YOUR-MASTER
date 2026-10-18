const { openVoiceRules } = require('../../handlers/setup-voice-rules')

module.exports = {
  name: "setup-joinvc",
  category: "Setup",
  aliases: ["setupjoinvc", "joinvc-setup"],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-joinvc',
  description: 'Configura las reglas de entrada con formularios y guardado explícito.',
  run: (client, message) => openVoiceRules(client, message, 'joinvc'),
}
