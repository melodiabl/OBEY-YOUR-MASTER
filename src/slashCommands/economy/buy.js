const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError } = require('../../core/ui/interactionKit')
const { CATALOG, money } = require('./_catalog')

function itemChoices () {
  return Object.entries(CATALOG).map(([key, it]) => ({ name: `${it.name} (${it.price})`, value: key }))
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Compra un ítem de la tienda')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Ítem a comprar')
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
        reason: 'Ese ítem no existe.',
        hint: `Usa ${Format.inlineCode('/shop')} para ver el catálogo.`
      }, { ephemeral: true })
    }

    const userData = await client.db.getUserData(interaction.user.id)
    if ((userData.money || 0) < item.price) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'Fondos insuficientes',
        reason: `Te faltan ${money(item.price - (userData.money || 0))} monedas.`,
        hint: `Tip: usa ${Format.inlineCode('/work')} o ${Format.inlineCode('/daily')}.`
      }, { ephemeral: true })
    }

    userData.money -= item.price
    if (!Array.isArray(userData.inventory)) userData.inventory = []
    userData.inventory.push(item.name)
    await userData.save()

    return replyOk(client, interaction, {
      system: 'economy',
      title: `${Emojis.success} Compra realizada`,
      lines: [
        `${Emojis.dot} Ítem: ${item.emoji} ${Format.bold(item.name)}`,
        `${Emojis.dot} Precio: ${Emojis.money} ${Format.inlineCode(money(item.price))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'Buen trade'
    }, { ephemeral: true })
  }
}

