const { SlashCommandBuilder } = require('discord.js')
const Systems = require('../../systems')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/interactionKit')
const { money } = require('./_catalog')

function norm (v) {
  return String(v || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function itemEmoji (item) {
  const e = item?.meta?.emoji
  return e ? String(e) : Emojis.inventory
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Vende un item de tu inventario (persistente)')
    .addStringOption(o => o
      .setName('item')
      .setDescription('Item (autocomplete)')
      .setRequired(true)
      .setAutocomplete(true))
    .addIntegerOption(o => o
      .setName('cantidad')
      .setDescription('Cantidad (opcional)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(25)),

  async autocomplete (client, interaction) {
    const focused = norm(interaction.options.getFocused() || '')
    const inv = await Systems.items.getUserInventory({ userID: interaction.user.id }).catch(() => [])
    const owned = (Array.isArray(inv) ? inv : [])
      .filter(x => x && typeof x === 'object' && x.itemId && Number(x.qty || 0) > 0)

    const ids = owned.map(x => String(x.itemId))
    const items = await Systems.items.getItemsByIds(ids).catch(() => [])
    const map = new Map(items.map(it => [String(it.itemId), it]))

    const out = owned
      .map((e) => ({ entry: e, item: map.get(String(e.itemId)) }))
      .filter((x) => x.item)
      .filter((x) => {
        if (!focused) return true
        return norm(x.item.itemId).includes(focused) || norm(x.item.name).includes(focused)
      })
      .slice(0, 25)
      .map((x) => {
        const sell = Number(x.item.sellPrice || 0)
        const name = `${itemEmoji(x.item)} ${x.item.name} [${x.item.itemId}] x${Number(x.entry.qty || 0)} - ${money(sell)}`
        return { name: name.slice(0, 100), value: x.item.itemId }
      })

    return interaction.respond(out).catch(() => {})
  },

  async execute (client, interaction) {
    const itemId = interaction.options.getString('item', true)
    const qty = interaction.options.getInteger('cantidad') || 1

    const item = await Systems.items.getItem(itemId).catch(() => null)
    if (!item) {
      return replyWarn(client, interaction, {
        system: 'economy',
        title: 'Item invalido',
        lines: [
          `${Emojis.dot} No existe: ${Format.inlineCode(itemId)}`,
          `${Emojis.dot} Tip: revisa tu inventario con ${Format.inlineCode('/inventory')}.`
        ]
      }, { ephemeral: true })
    }

    if (Number(item.sellPrice || 0) <= 0) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'No se puede vender',
        reason: `El item ${Format.inlineCode(item.itemId)} no tiene precio de venta.`
      }, { ephemeral: true })
    }

    try {
      const res = await Systems.items.sellItem({
        client,
        guildID: interaction.guild.id,
        userID: interaction.user.id,
        itemId,
        qty
      })

      const bal = await Systems.economy.getBalances(client, interaction.user.id).catch(() => ({ money: null, bank: null }))

      return replyOk(client, interaction, {
        system: 'economy',
        title: 'Venta realizada',
        lines: [
          `${Emojis.dot} Item: ${itemEmoji(res.item)} ${Format.bold(res.item.name)} ${Format.subtext(res.item.itemId)}`,
          `${Emojis.dot} Cantidad: ${Format.inlineCode(String(res.qty))}`,
          `${Emojis.dot} Ganancia: ${Emojis.money} ${Format.inlineCode(money(res.total))}`,
          bal?.money !== null ? `${Emojis.dot} Efectivo: ${Format.inlineCode(money(bal.money))}` : null
        ].filter(Boolean),
        signature: 'Venta persistente'
      }, { ephemeral: true })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'No se pudo vender',
        reason: String(e?.message || 'Error al vender.')
      }, { ephemeral: true })
    }
  }
}
