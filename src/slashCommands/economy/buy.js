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
    .setName('buy')
    .setDescription('Compra un item de la tienda (persistente)')
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
    const focused = interaction.options.getFocused() || ''
    const rows = await Systems.items.listShop({ query: focused })
    const out = rows.slice(0, 25).map((it) => {
      const buy = Number(it.buyPrice || 0)
      const name = `${itemEmoji(it)} ${it.name} [${it.itemId}] - ${money(buy)}`
      return { name: name.slice(0, 100), value: it.itemId }
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
          `${Emojis.dot} Tip: usa ${Format.inlineCode('/shop')} o el autocomplete.`
        ]
      }, { ephemeral: true })
    }

    if (Number(item.buyPrice || 0) <= 0) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'No esta en venta',
        reason: `El item ${Format.inlineCode(item.itemId)} no se puede comprar.`
      }, { ephemeral: true })
    }

    try {
      const res = await Systems.items.buyItem({
        client,
        guildID: interaction.guild.id,
        userID: interaction.user.id,
        itemId,
        qty
      })

      const bal = await Systems.economy.getBalances(client, interaction.user.id).catch(() => ({ money: null, bank: null }))

      return replyOk(client, interaction, {
        system: 'economy',
        title: 'Compra realizada',
        lines: [
          `${Emojis.dot} Item: ${itemEmoji(res.item)} ${Format.bold(res.item.name)} ${Format.subtext(res.item.itemId)}`,
          `${Emojis.dot} Cantidad: ${Format.inlineCode(String(res.qty))}`,
          `${Emojis.dot} Total: ${Emojis.money} ${Format.inlineCode(money(res.total))}`,
          bal?.money !== null ? `${Emojis.dot} Efectivo: ${Format.inlineCode(money(bal.money))}` : null,
          `${Emojis.dot} Ver inventario: ${Format.inlineCode('/inventory')}`
        ].filter(Boolean),
        signature: 'Compra persistente'
      }, { ephemeral: true })
    } catch (e) {
      const msg = String(e?.message || 'Error al comprar.')
      const hint = norm(msg).includes('saldo insuficiente') ? `Tip: usa ${Format.inlineCode('/work')} o ${Format.inlineCode('/daily')}.` : null
      return replyError(client, interaction, {
        system: 'economy',
        title: 'No se pudo comprar',
        reason: msg,
        hint
      }, { ephemeral: true })
    }
  }
}
