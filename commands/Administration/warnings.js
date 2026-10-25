const { runPrefixHistory } = require('../../src/modules/moderation')

module.exports = {
    name: 'warnings',
    category: 'Administration',
    aliases: ["warns", "warnlist", "warn-list"],
    description: 'Shows the warnings of a Usuario',
    usage: 'warnings @Usuario [página]',
    type: 'member',
    run: (client, message, args) => runPrefixHistory(client, message, args, 'warnings'),
}
