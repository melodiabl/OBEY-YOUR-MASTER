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
  DESCRIPTION: 'Envía monedas a otro usuario',
  ALIASES: ['enviar', 'pay'],
  async execute (client, message, args) {
    const target = message.mentions.users.first()
    const amount = Number.parseInt(args[1], 10)

    if (!target || !amount || amount <= 0) {
      return replyError(client, message, {
        system: 'economy',
        title: 'Uso incorrecto',
        reason: 'Falta usuario o cantidad.',
        hint: `Ejemplo: ${Format.inlineCode('give @usuario 250')}`
      })
    }

    if (target.bot) {
      return replyError(client, message, {
        system: 'economy',
        title: 'Destino inválido',
        reason: 'No puedes enviar dinero a bots.'
      })
    }

    if (target.id === message.author.id) {
      return replyError(client, message, {
        system: 'economy',
        title: 'Destino inválido',
        reason: 'No puedes enviarte dinero a ti mismo.'
      })
    }

    const senderData = await client.db.getUserData(message.author.id)
    if ((senderData.money || 0) < amount) {
      return replyError(client, message, {
        system: 'economy',
        title: 'Fondos insuficientes',
        reason: 'No tienes suficiente dinero.',
        hint: `Efectivo: ${Format.inlineCode(money(senderData.money || 0))}`
      })
    }

    const receiverData = await client.db.getUserData(target.id)
    senderData.money -= amount
    receiverData.money = (receiverData.money || 0) + amount
    await senderData.save()
    await receiverData.save()

    return replyOk(client, message, {
      system: 'economy',
      title: `${Emojis.success} Transferencia enviada`,
      lines: [
        `${Emojis.dot} A: ${target}`,
        `${Emojis.dot} Monto: ${Emojis.money} ${Format.inlineCode(money(amount))}`,
        `${Emojis.dot} Tu efectivo: ${Format.inlineCode(money(senderData.money || 0))}`
      ],
      signature: 'Transacción segura'
    })
  }
}

