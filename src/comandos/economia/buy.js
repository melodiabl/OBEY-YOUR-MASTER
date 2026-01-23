const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError } = require('../../core/ui/messageKit')

const SHOP = {
  pan: 50,
  hacha: 150,
  cana: 200,
  elixir: 500,
  escudo: 300
}

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  DESCRIPTION: 'Compra un artículo de la tienda',
  ALIASES: ['comprar'],
  async execute (client, message, args) {
    const item = String(args[0] || '').trim().toLowerCase()
    if (!item || !SHOP[item]) {
      return replyError(client, message, {
        system: 'economy',
        title: 'Artículo inválido',
        reason: 'Ese artículo no existe en la tienda.',
        hint: `Usa ${Format.inlineCode('shop')} para ver el catálogo.`
      })
    }

    const cost = SHOP[item]
    const userData = await client.db.getUserData(message.author.id)
    if ((userData.money || 0) < cost) {
      return replyError(client, message, {
        system: 'economy',
        title: 'Fondos insuficientes',
        reason: `Necesitas ${money(cost)} monedas.`,
        hint: `Tip: usa ${Format.inlineCode('work')} o ${Format.inlineCode('daily')}.`
      })
    }

    userData.money -= cost
    if (!Array.isArray(userData.inventory)) userData.inventory = []
    userData.inventory.push(item)
    await userData.save()

    return replyOk(client, message, {
      system: 'economy',
      title: `${Emojis.success} Compra realizada`,
      lines: [
        `${Emojis.dot} Item: ${Format.bold(item)}`,
        `${Emojis.dot} Precio: ${Emojis.money} ${Format.inlineCode(money(cost))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money))}`
      ],
      signature: 'Buen trade'
    })
  }
}

