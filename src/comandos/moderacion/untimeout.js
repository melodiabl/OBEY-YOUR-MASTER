const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk } = require('../../core/ui/messageKit')
const { resolveMemberFromArgs, parseReason } = require('../../core/commands/legacyArgs')

module.exports = {
  DESCRIPTION: 'Quita el timeout de un usuario.',
  ALIASES: ['unmute'],
  PERMISSIONS: ['ModerateMembers'],
  async execute (client, message, args) {
    const resolved = await resolveMemberFromArgs({ message, args, index: 0 })
    const member = resolved.member
    const user = resolved.user
    if (!member || !user) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'Falta el usuario',
        reason: 'Menciona un usuario del servidor.',
        hint: `Ej: ${Format.inlineCode('untimeout @user')}`
      })
    }

    const reason = parseReason(args, 1, 'Sin razón.')
    try {
      await member.timeout(null, reason)
      const modCase = await Systems.moderation.logAction({
        guildID: message.guild.id,
        type: 'untimeout',
        targetID: user.id,
        moderatorID: message.author.id,
        reason
      })

      return replyOk(client, message, {
        system: 'moderation',
        title: 'Timeout removido',
        lines: [
          `${Emojis.dot} Usuario: **${user.tag}** (${Format.inlineCode(user.id)})`,
          `${Emojis.dot} Caso: ${Format.inlineCode(`#${modCase.caseNumber}`)}`
        ],
        signature: `Razón: ${reason}`
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No pude remover el timeout',
        reason: e?.message || 'Error desconocido.'
      })
    }
  }
}
