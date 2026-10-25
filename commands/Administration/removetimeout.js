const { runPrefixMemberAction } = require('../../handlers/moderation/action')

module.exports = {
    name: 'removetimeout',
    category: 'Administration',
    description: 'Removes the timeouts of a Miembro from a Guild',
    usage: 'removetimeout @Usuario',
    type: 'member',
    run: (client, message, args) => runPrefixMemberAction(client, message, args, 'removetimeout'),
}
