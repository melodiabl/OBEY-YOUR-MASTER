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
  DESCRIPTION: 'Trabaja una vez cada hora para ganar monedas',
  ALIASES: ['trabajar'],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    const now = Date.now()
    const cooldownTime = 60 * 60 * 1000

    if (userData.workCooldown && userData.workCooldown > now) {
      const ts = Math.floor(userData.workCooldown / 1000)
      return replyWarn(client, message, {
        system: 'economy',
        title: 'Cooldown',
        lines: [
          `${Emojis.dot} Podrás volver a trabajar: <t:${ts}:R>`,
          `${Emojis.dot} Tip: mientras tanto, prueba ${Format.inlineCode('daily')}.`
        ]
      })
    }

    const amount = Math.floor(Math.random() * 51) + 50
    userData.money = (userData.money || 0) + amount
    userData.workCooldown = now + cooldownTime
    await userData.save()

    return replyOk(client, message, {
      system: 'economy',
      title: `${Emojis.work} Turno completado`,
      lines: [
        `${Emojis.dot} Ganaste: ${Emojis.money} ${Format.inlineCode(money(amount))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'Buen trabajo'
    })
  }
}

