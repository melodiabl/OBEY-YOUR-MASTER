const { runOwnerServers } = require('../../handlers/owner-server-list')
module.exports = {
  name: 'servers', aliases: ['serversin', 'guilds', 'guildsin'], category: 'Info',
  description: 'Consulta privada de los servidores del bot para sus propietarios actuales',
  usage: 'servers', type: 'bot',
  run: (client, message, args) => runOwnerServers(client, message, args)
}
