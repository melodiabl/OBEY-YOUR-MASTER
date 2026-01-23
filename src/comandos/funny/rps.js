const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')

const EMOJI = Object.freeze({
  rock: '🪨',
  paper: '📄',
  scissors: '✂️'
})

module.exports = {
  DESCRIPTION: 'Piedra, papel o tijera (con stats).',
  ALIASES: ['ppt'],
  async execute (client, message, args) {
    const choice = String(args?.[0] || '').trim().toLowerCase()
    const valid = new Set(Systems.games.CHOICES)
    if (!valid.has(choice)) {
      return replyError(client, message, {
        system: 'games',
        title: 'Elección inválida',
        reason: 'Usa: rock | paper | scissors.',
        hint: `Ej: ${Format.inlineCode('rps rock')}`
      })
    }

    const bot = Systems.games.randomChoice()
    const result = Systems.games.outcome(choice, bot)
    const stats = await Systems.games.recordResult({
      guildID: message.guild.id,
      userID: message.author.id,
      result
    })

    const label = result === 'win' ? `${Emojis.success} Ganaste` : result === 'loss' ? `${Emojis.error} Perdiste` : `${Emojis.warn} Empate`

    return replyEmbed(client, message, {
      system: 'games',
      kind: result === 'win' ? 'success' : result === 'loss' ? 'error' : 'info',
      title: `${Emojis.games} RPS`,
      description: [
        headerLine(Emojis.games, 'Resultado'),
        `${Emojis.dot} Tú: ${EMOJI[choice]} ${Format.bold(choice)}`,
        `${Emojis.dot} Bot: ${EMOJI[bot]} ${Format.bold(bot)}`,
        Format.softDivider(20),
        `${Emojis.dot} ${Format.bold(label)}`,
        Format.softDivider(20),
        `${Emojis.dot} Stats: W ${Format.inlineCode(stats.wins)} / L ${Format.inlineCode(stats.losses)} / T ${Format.inlineCode(stats.ties)}`,
        `${Emojis.dot} Streak: ${Format.inlineCode(stats.streak)} (best ${Format.inlineCode(stats.bestStreak)})`
      ].join('\n'),
      signature: 'GG'
    })
  }
}
