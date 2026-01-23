const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError, replyWarn } = require('../../core/ui/messageKit')

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  DESCRIPTION: 'Reclama tu recompensa diaria',
  ALIASES: ['diario'],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    const now = Date.now()
    const cooldownTime = 24 * 60 * 60 * 1000

    if (userData.dailyCooldown && userData.dailyCooldown > now) {
      const ts = Math.floor(userData.dailyCooldown / 1000)
      return replyWarn(client, message, {
        system: 'economy',
        title: 'Recompensa en cooldown',
        lines: [
          `${Emojis.dot} Disponible: <t:${ts}:R>`,
          `${Emojis.dot} Tip: usa ${Format.inlineCode('work')} para farmear.`
        ]
      })
    }

    const amount = Math.floor(Math.random() * 201) + 100
    userData.money = (userData.money || 0) + amount
    userData.dailyCooldown = now + cooldownTime
    await userData.save()

    return replyOk(client, message, {
      system: 'economy',
      title: `${Emojis.giveaway} Recompensa diaria`,
      lines: [
        `${Emojis.dot} Ganaste: ${Emojis.money} ${Format.inlineCode(money(amount))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'Nos vemos mañana'
    })
  }
}

