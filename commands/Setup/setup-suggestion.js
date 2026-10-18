const { openCommunitySetup } = require('../../handlers/setup-community')

module.exports = {
  name: "setup-suggestion",
  category: "Setup",
  aliases: [
        "setupsuggestion",
        "suggestionsetup",
        "suggestsetup",
        "suggestion-setup",
        "suggest-setup",
        "setup-suggest",
        "setupsuggest",
    ],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-suggestion',
  description: 'Configura suggestion y revisa los cambios antes de guardar.',
  run: (client, message) => openCommunitySetup(client, message, 'suggestion'),
}
