const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError } = require('../../core/ui/messageKit')

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  DESCRIPTION: 'Deposita monedas en tu banco',
  ALIASES: ['dep'],
  async execute (client, message, args) {
    const amount = Number.parseInt(args[0], 10)
    if (!amount || amount <= 0) {
      return replyError(client, message, {
        system: 'economy',
        title: 'Cantidad inválida',
        reason: 'Debes especificar una cantidad válida.',
        hint: `Ejemplo: ${Format.inlineCode('deposit 200')}`
      })
    }

    const userData = await client.db.getUserData(message.author.id)
    if ((userData.money || 0) < amount) {
      return replyError(client, message, {
        system: 'economy',
        title: 'Fondos insuficientes',
        reason: 'No tienes suficiente dinero en efectivo.',
        hint: `Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      })
    }

    userData.money -= amount
    userData.bank = (userData.bank || 0) + amount
    await userData.save()

    return replyOk(client, message, {
      system: 'economy',
      title: `${Emojis.success} Depósito realizado`,
      lines: [
        `${Emojis.dot} Monto: ${Emojis.money} ${Format.inlineCode(money(amount))}`,
        `${Emojis.dot} Banco: ${Format.inlineCode(money(userData.bank || 0))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'A salvo en el banco'
    })
  }
}

