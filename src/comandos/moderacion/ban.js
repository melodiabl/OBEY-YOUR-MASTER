const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk } = require('../../core/ui/messageKit')
const { resolveMemberFromArgs, parseReason, cleanId } = require('../../core/commands/legacyArgs')

module.exports = {
  DESCRIPTION: 'Banea a un usuario del servidor.',
  ALIASES: ['banear'],
  PERMISSIONS: ['BanMembers'],
  async execute (client, message, args) {
    const resolved = await resolveMemberFromArgs({ message, args, index: 0 })
    const user = resolved.user
    const member = resolved.member
    const targetId = user?.id || cleanId(args?.[0])

    if (!targetId) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'Falta el usuario',
        reason: 'Menciona un usuario o pasa un ID.',
        hint: `Ej: ${Format.inlineCode('ban @user razón')}`
      })
    }

    const reason = parseReason(args, 1, 'Sin razón.')
    if (member && !member.bannable) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No puedo banearlo',
        reason: 'Me faltan permisos/jerarquía.',
        hint: 'Revisa roles del bot.'
      })
    }

    try {
      await message.guild.members.ban(targetId, { reason })
      const modCase = await Systems.moderation.logAction({
        guildID: message.guild.id,
        type: 'ban',
        targetID: targetId,
        moderatorID: message.author.id,
        reason
      })

      return replyOk(client, message, {
        system: 'moderation',
        title: 'Ban aplicado',
        lines: [
          `${Emojis.dot} Usuario: ${user ? `**${user.tag}**` : Format.inlineCode(targetId)} (${Format.inlineCode(targetId)})`,
          `${Emojis.dot} Caso: ${Format.inlineCode(`#${modCase.caseNumber}`)}`,
          `${Emojis.quote} Razón: ${Format.italic(reason)}`
        ]
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No pude banear',
        reason: e?.message || 'Error desconocido.'
      })
    }
  }
}
