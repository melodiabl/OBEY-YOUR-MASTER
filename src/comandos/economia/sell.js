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
  DESCRIPTION: 'Vende un artículo de tu inventario por la mitad del precio',
  ALIASES: ['vender'],
  async execute (client, message, args) {
    const item = String(args[0] || '').trim().toLowerCase()
    if (!item || !SHOP[item]) {
      return replyError(client, message, {
        system: 'economy',
        title: 'Artículo inválido',
        reason: 'Ese artículo no se puede vender.',
        hint: `Usa ${Format.inlineCode('inventory')} para ver tu inventario.`
      })
    }

    const userData = await client.db.getUserData(message.author.id)
    if (!Array.isArray(userData.inventory) || !userData.inventory.includes(item)) {
      return replyError(client, message, {
        system: 'economy',
        title: 'No lo tienes',
        reason: 'Ese artículo no está en tu inventario.',
        hint: `Tip: compra con ${Format.inlineCode('buy ' + item)}.`
      })
    }

    const index = userData.inventory.indexOf(item)
    userData.inventory.splice(index, 1)
    const gain = Math.floor(SHOP[item] / 2)
    userData.money = (userData.money || 0) + gain
    await userData.save()

    return replyOk(client, message, {
      system: 'economy',
      title: `${Emojis.success} Venta realizada`,
      lines: [
        `${Emojis.dot} Item: ${Format.bold(item)}`,
        `${Emojis.dot} Ganancia: ${Emojis.money} ${Format.inlineCode(money(gain))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money))}`
      ],
      signature: 'Sigue farmeando'
    })
  }
}

