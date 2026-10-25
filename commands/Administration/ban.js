const { runPrefixBan } = require('../../handlers/moderation/action')

module.exports = {
    name: 'ban',
    category: 'Administration',
    aliases: ["banhammer", "tempban"],
    description: "Banea permanentemente a un miembro; los días indican mensajes que se eliminan.",
    usage: "ban @Usuario [días de mensajes a borrar: 0–7] [motivo]",
    type: 'member',
    run: (client, message, args) => runPrefixBan(client, message, args, 'ban'),
}
