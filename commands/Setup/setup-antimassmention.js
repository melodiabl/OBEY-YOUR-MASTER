const { openSecuritySetup } = require('../../handlers/setup-security')

module.exports = {
  name: "setup-antimassmention",
  category: "Setup",
  aliases: [
        "setupantimassmention",
        "setup-massmention",
        "setupmassmention",
        "antimassmention-setup",
        "antimassmentionsetup",
    ],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "security",
  usage: 'setup-antimassmention',
  description: 'Configura la protección antimention y revisa los cambios antes de guardar.',
  run: (client, message) => openSecuritySetup(client, message, 'antimention'),
}
