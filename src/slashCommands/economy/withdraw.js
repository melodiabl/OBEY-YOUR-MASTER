const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyError } = require('../../core/ui/interactionKit')
const { money } = require('./_catalog')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Retira dinero del banco')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a retirar')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute (client, interaction) {
    const amount = interaction.options.getInteger('cantidad', true)
    const userData = await client.db.getUserData(interaction.user.id)

    if ((userData.bank || 0) < amount) {
      return replyError(client, interaction, {
        system: 'economy',
        title: 'Fondos insuficientes',
        reason: 'No tienes suficiente dinero en el banco.',
        hint: `Banco: ${Format.inlineCode(money(userData.bank || 0))}`
      }, { ephemeral: true })
    }

    userData.bank -= amount
    userData.money = (userData.money || 0) + amount
    await userData.save()

    return replyOk(client, interaction, {
      system: 'economy',
      title: `${Emojis.success} Retiro realizado`,
      lines: [
        `${Emojis.dot} Monto: ${Emojis.money} ${Format.inlineCode(money(amount))}`,
        `${Emojis.dot} Banco: ${Format.inlineCode(money(userData.bank || 0))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'Liquidez lista'
    }, { ephemeral: true })
  }
}

