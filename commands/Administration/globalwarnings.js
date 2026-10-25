const { runPrefixHistory } = require('../../src/modules/moderation')

module.exports = {
    name: 'globalwarnings',
    category: 'Administration',
    aliases: ["globalwarns", "globalwarnlist", "global-warn-list"],
    description: 'Shows warnings from servers where you have staff access',
    usage: 'globalwarnings @Usuario [página]',
    type: 'member',
    run: (client, message, args) => runPrefixHistory(client, message, args, 'globalwarnings'),
}
