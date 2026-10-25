const { runPrefixBan } = require('../../handlers/moderation/action')

module.exports = {
    name: 'useridban',
    category: 'Administration',
    aliases: ["hackban", "hban", "uban"],
    description: "Bans a Usuario from the Guild, just by adding the ID. He does not need to be in your Guild...",
    usage: "useridban <ID> [Reason]",
    type: 'member',
    run: (client, message, args) => runPrefixBan(client, message, args, 'useridban'),
}
