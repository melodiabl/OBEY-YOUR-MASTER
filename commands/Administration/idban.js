const { runPrefixBan } = require('../../handlers/moderation/action')

module.exports = {
    name: 'idban',
    category: 'Administration',
    aliases: ["idbanhammer", "idban"],
    description: "Bans a Miembro from a Guild",
    usage: "idban <userid> [Reason]",
    type: 'member',
    run: (client, message, args) => runPrefixBan(client, message, args, 'idban'),
}
