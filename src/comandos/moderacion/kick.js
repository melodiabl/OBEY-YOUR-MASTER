const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk } = require('../../core/ui/messageKit')
const { resolveMemberFromArgs, parseReason } = require('../../core/commands/legacyArgs')

module.exports = {
  DESCRIPTION: 'Expulsa a un usuario del servidor.',
  ALIASES: ['expulsar'],
  PERMISSIONS: ['KickMembers'],
  async execute (client, message, args) {
    const resolved = await resolveMemberFromArgs({ message, args, index: 0 })
    const member = resolved.member
    const user = resolved.user
    if (!member || !user) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'Falta el usuario',
        reason: 'Menciona un usuario del servidor.',
        hint: `Ej: ${Format.inlineCode('kick @user razón')}`
      })
    }

    const reason = parseReason(args, 1, 'Sin razón.')
    if (!member.kickable) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No puedo kickearlo',
        reason: 'Me faltan permisos/jerarquía.',
        hint: 'Revisa roles del bot.'
      })
    }

    try {
      await member.kick(reason)
      const modCase = await Systems.moderation.logAction({
        guildID: message.guild.id,
        type: 'kick',
        targetID: user.id,
        moderatorID: message.author.id,
        reason
      })

      return replyOk(client, message, {
        system: 'moderation',
        title: 'Kick aplicado',
        lines: [
          `${Emojis.dot} Usuario: **${user.tag}** (${Format.inlineCode(user.id)})`,
          `${Emojis.dot} Caso: ${Format.inlineCode(`#${modCase.caseNumber}`)}`,
          `${Emojis.quote} Razón: ${Format.italic(reason)}`
        ]
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No pude expulsar',
        reason: e?.message || 'Error desconocido.'
      })
    }
  }
}
