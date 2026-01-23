const ms = require('ms')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/messageKit')
const { resolveMemberFromArgs, parseReason } = require('../../core/commands/legacyArgs')

module.exports = {
  DESCRIPTION: 'Silencia a un usuario temporalmente.',
  ALIASES: ['mute'],
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
        hint: `Ej: ${Format.inlineCode('timeout @user 10m flood')}`
      })
    }
    if (user.bot) {
      return replyWarn(client, message, {
        system: 'moderation',
        title: 'Acción inválida',
        lines: ['No puedes silenciar a un bot.']
      })
    }

    const durationStr = String(args?.[1] || '').trim()
    const durationMs = ms(durationStr)
    if (!durationMs || durationMs < 5000 || durationMs > 2419200000) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'Duración inválida',
        reason: 'Debe ser entre 5 segundos y 28 días.',
        hint: 'Ej: 10m, 1h, 1d'
      })
    }

    const reason = parseReason(args, 2, 'Sin razón.')
    if (!member.manageable || !member.moderatable) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No puedo aplicarlo',
        reason: 'Me faltan permisos/jerarquía para moderar a ese usuario.',
        hint: 'Revisa roles del bot y permisos.'
      })
    }

    try {
      await member.timeout(durationMs, reason)
      const modCase = await Systems.moderation.logAction({
        guildID: message.guild.id,
        type: 'timeout',
        targetID: user.id,
        moderatorID: message.author.id,
        reason,
        meta: { durationMs }
      })

      return replyOk(client, message, {
        system: 'moderation',
        title: 'Timeout aplicado',
        lines: [
          `${Emojis.dot} Usuario: **${user.tag}** (${Format.inlineCode(user.id)})`,
          `${Emojis.dot} Duración: ${Format.inlineCode(durationStr)}`,
          `${Emojis.dot} Caso: ${Format.inlineCode(`#${modCase.caseNumber}`)}`,
          `${Emojis.quote} Razón: ${Format.italic(reason)}`
        ],
        signature: 'Moderación activa'
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No pude silenciar',
        reason: e?.message || 'Error desconocido.'
      })
    }
  }
}
