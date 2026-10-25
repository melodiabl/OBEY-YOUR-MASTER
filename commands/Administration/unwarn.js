const { runPrefixRemoval } = require('../../src/modules/moderation')

module.exports = {
    name: 'unwarn',
    category: 'Administration',
    aliases: ["removewarn", "warnremove"],
    description: 'Remove warnings from a member in this server',
    usage: 'unwarn @Usuario <número>',
    type: 'member',
    run: (client, message, args) => runPrefixRemoval(client, message, args, 'unwarn'),
}
