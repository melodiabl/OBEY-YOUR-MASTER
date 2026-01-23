const UserSchema = require('../../database/schemas/UserSchema')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/messageKit')
const { resolveMemberFromArgs, parseReason } = require('../../core/commands/legacyArgs')

module.exports = {
  DESCRIPTION: 'Elimina todos los warns de un usuario.',
  ALIASES: ['cw'],
  PERMISSIONS: ['ModerateMembers'],
  async execute (client, message, args) {
    const resolved = await resolveMemberFromArgs({ message, args, index: 0 })
    const user = resolved.user
    if (!user) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'Falta el usuario',
        reason: 'Menciona un usuario o pasa un ID.',
        hint: `Ej: ${Format.inlineCode('clearwarns @user')}`
      })
    }
    if (user.bot) {
      return replyWarn(client, message, {
        system: 'moderation',
        title: 'Acción inválida',
        lines: ['Los bots no tienen warns.']
      })
    }

    const reason = parseReason(args, 1, 'Sin razón.')
    const doc = await UserSchema.findOne({ userID: user.id })
    const removed = Array.isArray(doc?.warns) ? doc.warns.length : 0

    await UserSchema.findOneAndUpdate(
      { userID: user.id },
      { $setOnInsert: { userID: user.id }, $set: { warns: [] } },
      { upsert: true, new: true }
    )

    const modCase = await Systems.moderation.logAction({
      guildID: message.guild.id,
      type: 'clearwarns',
      targetID: user.id,
      moderatorID: message.author.id,
      reason,
      meta: { removed }
    })

    return replyOk(client, message, {
      system: 'moderation',
      title: 'Warns limpiados',
      lines: [
        `${Emojis.dot} Usuario: **${user.tag}** (${Format.inlineCode(user.id)})`,
        `${Emojis.dot} Warns eliminados: ${Format.inlineCode(removed)}`,
        `${Emojis.dot} Caso: ${Format.inlineCode(`#${modCase.caseNumber}`)}`
      ],
      signature: `Razón: ${reason}`
    })
  }
}
