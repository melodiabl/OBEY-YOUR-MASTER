const UserSchema = require('../../database/schemas/UserSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyWarn } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

module.exports = {
  DESCRIPTION: 'Top de niveles (servidor).',
  ALIASES: ['top', 'lb'],
  async execute (client, message) {
    const rows = await UserSchema.find({}).sort({ level: -1, xp: -1 }).limit(10)
    const ranked = rows.filter(r => Number(r.level || 0) > 0 || Number(r.xp || 0) > 0)

    if (!ranked.length) {
      return replyWarn(client, message, {
        system: 'levels',
        title: 'Sin ranking',
        lines: ['Todavía no hay datos suficientes de niveles en este servidor.']
      })
    }

    const lines = ranked.map((r, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : Emojis.dot
      return `${medal} ${Format.bold(`#${i + 1}`)} <@${r.userID}> — lvl ${Format.inlineCode(r.level)} • xp ${Format.inlineCode(r.xp)}`
    })

    return replyEmbed(client, message, {
      system: 'levels',
      kind: 'info',
      title: `${Emojis.stats} Leaderboard`,
      description: [
        headerLine(Emojis.level, 'Top niveles'),
        ...lines
      ].join('\n'),
      signature: 'Compite sanamente'
    })
  }
}
