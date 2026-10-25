const { runPrefixMemberAction } = require('../../handlers/moderation/action')

module.exports = {
    name: 'timeout',
    category: 'Administration',
    description: 'Timeouts a Miembro from a Guild',
    usage: 'timeout @Usuario <Timespan> [Reason] | e.g: timeout @Usuario 10h+20min Stop spamming!',
    type: 'member',
    run: (client, message, args) => runPrefixMemberAction(client, message, args, 'timeout'),
}
