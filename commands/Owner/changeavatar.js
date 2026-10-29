const { runBotProfileCommand } = require('../../handlers/bot-profile-command')
module.exports = {
  name: 'changeavatar', category: 'Owner', type: 'bot', aliases: ['changebotavatar', 'botavatar', 'botprofilepicture', 'botpfp'], cooldown: 5,
  usage: 'changeavatar <Discord image URL or attachment>', description: 'El propietario cambia el avatar con un PNG, JPEG o GIF adjunto o del CDN de Discord.',
  run: (client, message, args) => runBotProfileCommand(client, message, args, 'avatar'),
}
