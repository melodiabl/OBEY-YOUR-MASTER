const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError } = require('../../core/ui/interactionKit')
const { CATALOG, money } = require('./_catalog')

function itemChoices () {
  return Object.entries(CATALOG).map(([key, it]) => ({ name: `${it.name} (${Math.floor(it.price / 2)})`, value: key }))
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Vende un ítem del inventario (50%)')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Ítem a vender')
        .setRequired(true)
        .addChoices(...itemChoices())
    ),

  async execute (client, interaction) {
    const key = interaction.options.getString('item', true)
    const item = CATALOG[key]
    if (!item) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'Ítem inválido',
        reason: 'Ese ítem no se puede vender.'
      }, { ephemeral: true })
    }

    const userData = await client.db.getUserData(interaction.user.id)
    const inv = Array.isArray(userData.inventory) ? userData.inventory : []
    const idx = inv.findIndex(x => String(x).toLowerCase() === String(item.name).toLowerCase())
    if (idx < 0) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'No lo tienes',
        reason: 'Ese ítem no está en tu inventario.',
        hint: `Tip: compra con ${Format.inlineCode('/buy')}.`
      }, { ephemeral: true })
    }

    inv.splice(idx, 1)
    const gain = Math.floor(item.price / 2)
    userData.inventory = inv
    userData.money = (userData.money || 0) + gain
    await userData.save()

    return replyOk(client, interaction, {
      system: 'economy',
      title: `${Emojis.success} Venta realizada`,
      lines: [
        `${Emojis.dot} Ítem: ${item.emoji} ${Format.bold(item.name)}`,
        `${Emojis.dot} Ganancia: ${Emojis.money} ${Format.inlineCode(money(gain))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'Sigue farmeando'
    }, { ephemeral: true })
  }
}

