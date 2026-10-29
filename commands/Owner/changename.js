const { runBotProfileCommand } = require('../../handlers/bot-profile-command')
module.exports = {
  name: 'changename', category: 'Owner', type: 'bot', aliases: ['changebotname', 'botname'], cooldown: 5,
  usage: 'changename <NEW BOT NAME>', description: 'El propietario cambia el nombre global del bot con confirmación de Discord.',
  run: (client, message, args) => runBotProfileCommand(client, message, args, 'name'),
}
