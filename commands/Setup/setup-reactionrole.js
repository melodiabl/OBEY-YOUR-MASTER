const { openReactionRolesSetup } = require('../../handlers/setup-reaction-roles')

module.exports = {
  name: "setup-reactionrole",
  category: "Setup",
  aliases: [
        "setupreactionrole",
        "setup-react",
        "setupreact",
        "reactionrolesetup",
        "reactionrole-setup",
        "react-setup",
        "reactsetup",
    ],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "system",
  usage: 'setup-reactionrole',
  description: 'Configura roles por reacciones con un formulario y publica el panel guardado.',
  run: (client, message) => openReactionRolesSetup(client, message),
}
