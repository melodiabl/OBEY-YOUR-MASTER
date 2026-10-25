const { runPrefixRemoval } = require('../../src/modules/moderation')

module.exports = {
    name: 'removeallwarns',
    category: 'Administration',
    aliases: ["removeallwarn", "removeallwarnings"],
    description: 'Remove warnings from a member in this server',
    usage: 'removeallwarns @Usuario',
    type: 'member',
    run: (client, message, args) => runPrefixRemoval(client, message, args, 'removeallwarns'),
}
