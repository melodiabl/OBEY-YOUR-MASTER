const { openCommunitySetup } = require('../../handlers/setup-community')

module.exports = {
  name: "setup-counter",
  category: "Setup",
  aliases: [
        "setupcounter",
        "counter-setup",
        "countersetup",
        "setup-numbercounter",
        "setupnumbercounter",
        "numbercounter-setup",
        "numbercountersetup",
    ],
  cooldown: 5,
  memberpermissions: ['Administrador'],
  type: "fun",
  usage: 'setup-counter',
  description: 'Configura counter y revisa los cambios antes de guardar.',
  run: (client, message) => openCommunitySetup(client, message, 'counter'),
}
