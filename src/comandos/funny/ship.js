const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyError } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')
const { resolveMemberFromArgs } = require('../../core/commands/legacyArgs')

function hashPair (a, b) {
  const s = `${String(a)}:${String(b)}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function label (pct) {
  if (pct >= 90) return '❤️‍🔥 *Nivel legendario*'
  if (pct >= 75) return '💖 *Se siente real*'
  if (pct >= 55) return '💘 *Hay química*'
  if (pct >= 35) return '💔 *Complicado…*'
  return '🖤 *Mejor como amigos*'
}

module.exports = {
  DESCRIPTION: 'Mide compatibilidad entre dos usuarios.',
  ALIASES: ['love'],
  async execute (client, message, args) {
    const first = await resolveMemberFromArgs({ message, args, index: 0 })
    const user1 = first.user
    if (!user1) {
      return replyError(client, message, {
        system: 'fun',
        title: 'Falta el primer usuario',
        reason: 'Menciona a alguien.',
        hint: `Ej: ${Format.inlineCode('ship @user @user2')}`
      })
    }

    const secondToken = String(args?.[1] || '').trim()
    const user2 = message.mentions.users.size >= 2
      ? message.mentions.users.toJSON()[1]
      : (secondToken ? (await resolveMemberFromArgs({ message, args, index: 1 })).user : null) || message.author

    const h = hashPair(user1.id, user2.id)
    const pct = h % 101

    return replyEmbed(client, message, {
      system: 'fun',
      kind: 'info',
      title: '💘 Ship',
      description: [
        headerLine('💘', 'Compatibilidad'),
        `${Emojis.dot} **${user1.username}** × **${user2.username}**`,
        Format.softDivider(20),
        `${Emojis.dot} Resultado: **${pct}%**`,
        `${Emojis.dot} ${label(pct)}`
      ].join('\n'),
      thumbnail: user1.displayAvatarURL({ size: 256 }),
      signature: 'Cálculo pseudo-determinista'
    })
  }
}
