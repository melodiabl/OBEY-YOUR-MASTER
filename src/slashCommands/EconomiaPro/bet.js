const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyWarn, replyError } = require('../../core/ui/interactionKit')

function money (n) {
  try {
    return Number(n || 0).toLocaleString('es-ES')
  } catch (e) {
    return String(n || 0)
  }
}

module.exports = {
  REGISTER: false,
  CMD: new SlashCommandBuilder()
    .setName('bet')
    .setDescription('Apuesta una cantidad de dinero (legacy)')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a apostar')
        .setRequired(true)
        .setMinValue(10)
    ),

  async execute (client, interaction) {
    const amount = interaction.options.getInteger('cantidad', true)
    const userData = await client.db.getUserData(interaction.user.id)

    if (!userData || (userData.money || 0) < amount) {
      return replyError(client, interaction, {
        system: 'games',
        title: 'Fondos insuficientes',
        reason: 'No tienes suficiente dinero para apostar esa cantidad.'
      }, { ephemeral: true })
    }

    const win = Math.random() > 0.5
    const multiplier = 2

    if (win) {
      const profit = amount * (multiplier - 1)
      userData.money += profit
      await userData.save()
      return replyOk(client, interaction, {
        system: 'games',
        title: `${Emojis.success} ¡Ganaste!`,
        lines: [
          `${Emojis.dot} Ganancia: ${Emojis.money} ${Format.inlineCode(money(profit))}`,
          `${Emojis.dot} Nuevo saldo: ${Format.inlineCode(money(userData.money || 0))}`
        ],
        signature: 'Suerte top'
      }, { ephemeral: true })
    }

    userData.money -= amount
    await userData.save()
    return replyWarn(client, interaction, {
      system: 'games',
      title: 'Perdiste',
      lines: [
        `${Emojis.dot} Pérdida: ${Emojis.money} ${Format.inlineCode(money(amount))}`,
        `${Emojis.dot} Nuevo saldo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'Otra ronda'
    }, { ephemeral: true })
  }
}

