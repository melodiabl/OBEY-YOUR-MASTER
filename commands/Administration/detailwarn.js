const { runPrefixHistory } = require('../../src/modules/moderation')

module.exports = {
    name: 'detailwarn',
    category: 'Administration',
    aliases: ["warninfo", "snipe", "infowarn", "infowarning", "detailwarning", "warninginfo"],
    description: 'Shows details about one warn Comando of a Miembro',
    usage: 'detailwarn @Usuario <índice>',
    type: 'member',
    run: (client, message, args) => runPrefixHistory(client, message, args, 'detailwarn'),
}
