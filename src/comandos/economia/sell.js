const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError, replyWarn } = require('../../core/ui/messageKit')
const { money } = require('../../slashCommands/economy/_catalog')

function itemEmoji (item) {
  const e = item?.meta?.emoji
  return e ? String(e) : Emojis.inventory
}

async function resolveItem (raw) {
  const token = String(raw || '').trim()
  if (!token) return { ok: false, reason: 'Falta item.' }

  const byId = await Systems.items.getItem(token).catch(() => null)
  if (byId) return { ok: true, item: byId }

  const rows = await Systems.items.listShop({ query: token }).catch(() => [])
  if (!rows.length) return { ok: false, reason: 'Item invalido.' }
  if (rows.length === 1) return { ok: true, item: rows[0] }

  const names = rows.slice(0, 5).map(r => Format.inlineCode(r.itemId)).join(', ')
  return { ok: false, reason: 'Busqueda ambigua.', hint: `Opciones: ${names}` }
}

module.exports = {
  DESCRIPTION: 'Vende un item de tu inventario (persistente).',
  ALIASES: ['vender'],
  async execute (client, message, args) {
    const itemToken = String(args?.[0] || '').trim()
    const qty = Math.max(1, Number(args?.[1]) || 1)

    const resolved = await resolveItem(itemToken)
    if (!resolved.ok) {
      return replyError(client, message, {
        system: 'economy',
        title: 'No se pudo vender',
        reason: resolved.reason,
        hint: resolved.hint || `Tip: usa ${Format.inlineCode('inventory')} para ver tu inventario.`
      })
    }

    const item = resolved.item
    if (Number(item.sellPrice || 0) <= 0) {
      return replyWarn(client, message, {
        system: 'economy',
        title: 'No se puede vender',
        lines: [`${Emojis.dot} ${Format.inlineCode(item.itemId)} no tiene precio de venta.`]
      })
    }

    try {
      const res = await Systems.items.sellItem({
        client,
        guildID: message.guild.id,
        userID: message.author.id,
        itemId: item.itemId,
        qty
      })

      const bal = await Systems.economy.getBalances(client, message.author.id).catch(() => ({ money: null, bank: null }))

      return replyOk(client, message, {
        system: 'economy',
        title: 'Venta realizada',
        lines: [
          `${Emojis.dot} Item: ${itemEmoji(res.item)} ${Format.bold(res.item.name)} ${Format.subtext(res.item.itemId)}`,
          `${Emojis.dot} Cantidad: ${Format.inlineCode(String(res.qty))}`,
          `${Emojis.dot} Ganancia: ${Emojis.money} ${Format.inlineCode(money(res.total))}`,
          bal?.money !== null ? `${Emojis.dot} Efectivo: ${Format.inlineCode(money(bal.money))}` : null
        ].filter(Boolean),
        signature: 'Venta persistente'
      })
    } catch (e) {
      return replyError(client, message, {
        system: 'economy',
        title: 'No se pudo vender',
        reason: String(e?.message || 'Error al vender.')
      })
    }
  }
}
