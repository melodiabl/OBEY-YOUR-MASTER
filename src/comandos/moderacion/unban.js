const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk } = require('../../core/ui/messageKit')
const { resolveMemberFromArgs, parseReason, cleanId } = require('../../core/commands/legacyArgs')

module.exports = {
  DESCRIPTION: 'Quita el ban de un usuario.',
  ALIASES: ['desbanear'],
  PERMISSIONS: ['BanMembers'],
  async execute (client, message, args) {
    const resolved = await resolveMemberFromArgs({ message, args, index: 0 })
    const user = resolved.user
    const targetId = user?.id || cleanId(args?.[0])

    if (!targetId) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'Falta el usuario',
        reason: 'Menciona un usuario o pasa un ID.',
        hint: `Ej: ${Format.inlineCode('unban 123456789...')}`
      })
    }

    const reason = parseReason(args, 1, 'Sin razón.')
    try {
      await message.guild.members.unban(targetId, reason)
      const modCase = await Systems.moderation.logAction({
        guildID: message.guild.id,
        type: 'unban',
        targetID: targetId,
        moderatorID: message.author.id,
        reason
      })

      return replyOk(client, message, {
        system: 'moderation',
        title: 'Unban aplicado',
        lines: [
          `${Emojis.dot} Usuario: ${user ? `**${user.tag}**` : Format.inlineCode(targetId)} (${Format.inlineCode(targetId)})`,
          `${Emojis.dot} Caso: ${Format.inlineCode(`#${modCase.caseNumber}`)}`,
          `${Emojis.quote} Razón: ${Format.italic(reason)}`
        ]
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No pude quitar el ban',
        reason: e?.message || 'Error desconocido.'
      })
    }
  }
}
