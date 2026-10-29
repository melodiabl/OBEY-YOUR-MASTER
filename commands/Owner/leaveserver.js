const { runGuildLeave } = require('../../handlers/owner-guild-leave-command')
module.exports = {
  name: 'leaveserver', type: 'info', category: 'Owner', aliases: ['serverleave', 'kickbot'],
  description: 'Ask the bot to leave an exact server after owner confirmation', usage: 'leaveserver <GUILDID>',
  run: (client, message, args) => runGuildLeave(client, message, args),
}
