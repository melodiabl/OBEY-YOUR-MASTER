const { runPrefixMemberAction } = require('../../handlers/moderation/action')

module.exports = {
    name: 'kick',
    category: 'Administration',
    aliases: [''],
    description: 'Kicks a Miembro from a Guild',
    usage: 'kick @Usuario [Reason]',
    type: 'member',
    run: (client, message, args) => runPrefixMemberAction(client, message, args, 'kick'),
}
