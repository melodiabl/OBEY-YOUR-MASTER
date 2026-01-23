const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/messageKit')
const { resolveMemberFromArgs } = require('../../core/commands/legacyArgs')

module.exports = {
  DESCRIPTION: 'Quita un warn (último o por índice).',
  ALIASES: ['uw'],
  PERMISSIONS: ['ModerateMembers'],
  async execute (client, message, args) {
    const resolved = await resolveMemberFromArgs({ message, args, index: 0 })
    const user = resolved.user
    if (!user) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'Falta el usuario',
        reason: 'Menciona un usuario o pasa un ID.',
        hint: `Ej: ${Format.inlineCode('unwarn @user')}`
      })
    }
    if (user.bot) {
      return replyWarn(client, message, {
        system: 'moderation',
        title: 'Acción inválida',
        lines: ['Los bots no tienen warns.']
      })
    }

    const indexRaw = args?.[1]
    const index = indexRaw ? Number(indexRaw) : null

    try {
      const res = await Systems.moderation.unwarnUser({
        guildID: message.guild.id,
        targetID: user.id,
        moderatorID: message.author.id,
        index: Number.isFinite(index) ? index : null
      })

      const extra = Number.isFinite(index) ? `Índice: ${Format.inlineCode(index)}` : 'Último warn'
      return replyOk(client, message, {
        system: 'moderation',
        title: 'Warn removido',
        lines: [
          `${Emojis.dot} Usuario: **${user.tag}** (${Format.inlineCode(user.id)})`,
          `${Emojis.dot} ${extra}`,
          `${Emojis.dot} Warns restantes: ${Format.inlineCode(res.remaining)}`,
          res.removed?.reason ? `${Emojis.quote} Razón removida: ${Format.italic(res.removed.reason)}` : null
        ].filter(Boolean)
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'No pude remover el warn',
        reason: e?.message || 'Error desconocido.'
      })
    }
  }
}
