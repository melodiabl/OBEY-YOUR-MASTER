const { PermissionFlagsBits } = require('discord.js')
const obeyMeta = require('../../handlers/presentation/metadata')
const { unbanUser, unbanReply } = require('../../handlers/moderation/action')
const { t, localeFor } = require('../../handlers/i18n')

module.exports = {
    name: 'unban',
    category: 'Administration',
    aliases: ['unbanhammer'],
    description: 'Unbans a Miembro from this Guild',
    usage: 'unban <ID>',
    memberpermissions: ['Administrador'],
    type: 'member',
    run: async (client, message, args) => {
        const locale = localeFor(client, message.guild.id)
        const es = client.settings.get(message.guild.id, 'embed')
        const result = await unbanUser(client, {
            guild: message.guild,
            actorId: message.author.id,
            userId: args[0],
            actorPermission: PermissionFlagsBits.Administrator,
            reason: t(locale, 'moderation.noReason'),
        })
        const payload = unbanReply(result, locale, { successColor: es.color, errorColor: es.wrongcolor })
        payload.embeds[0].setFooter(obeyMeta.asFooter(client.getFooter(es)))
        return message.reply(payload)
    },
}
