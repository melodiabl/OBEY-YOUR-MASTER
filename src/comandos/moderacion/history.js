const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')
const { resolveMemberFromArgs } = require('../../core/commands/legacyArgs')

module.exports = {
  DESCRIPTION: 'Muestra el historial de moderación de un usuario.',
  ALIASES: ['modlog', 'historial'],
  PERMISSIONS: ['ModerateMembers'],
  async execute (client, message, args) {
    const resolved = await resolveMemberFromArgs({ message, args, index: 0 })
    const user = resolved.user
    if (!user) {
      return replyError(client, message, {
        system: 'moderation',
        title: 'Falta el usuario',
        reason: 'Menciona un usuario o pasa un ID.',
        hint: `Ej: ${Format.inlineCode('history @user')}`
      })
    }

    const { cases, warnsCount } = await Systems.moderation.getUserHistory({
      guildID: message.guild.id,
      targetID: user.id,
      limit: 10
    })

    const lines = (cases || []).map(c => {
      const ts = `<t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`
      return `${Emojis.dot} ${Format.bold(`#${c.caseNumber}`)} ${Format.inlineCode(c.type)} ${ts}\n${Emojis.quote} ${Format.italic(c.reason || 'Sin razón.')}`
    })

    return replyEmbed(client, message, {
      system: 'moderation',
      kind: 'info',
      title: `${Emojis.moderation} Historial`,
      description: [
        headerLine(Emojis.moderation, user.tag),
        `${Emojis.dot} Warns activos: ${Format.inlineCode(warnsCount)}`,
        Format.softDivider(20),
        lines.length ? lines.join('\n') : `${Emojis.dot} ${Format.italic('Sin casos registrados.')}`
      ].join('\n'),
      signature: 'Moderación trazable'
    })
  }
}
