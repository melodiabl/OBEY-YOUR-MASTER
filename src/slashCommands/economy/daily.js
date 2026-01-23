const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyWarn } = require('../../core/ui/interactionKit')
const { money } = require('./_catalog')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Reclama tu recompensa diaria (cooldown)'),

  async execute (client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id)
    const now = Date.now()
    const cooldownTime = 24 * 60 * 60 * 1000

    if (userData.dailyCooldown && userData.dailyCooldown > now) {
      const ts = Math.floor(userData.dailyCooldown / 1000)
      return replyWarn(client, interaction, {
        system: 'economy',
        title: 'Recompensa en cooldown',
        lines: [
          `${Emojis.dot} Disponible: <t:${ts}:R>`,
          `${Emojis.dot} Tip: usa ${Format.inlineCode('/work')} para farmear.`
        ]
      }, { ephemeral: true })
    }

    const amount = Math.floor(Math.random() * 201) + 100
    userData.money = (userData.money || 0) + amount
    userData.dailyCooldown = now + cooldownTime
    await userData.save()

    return replyOk(client, interaction, {
      system: 'economy',
      title: `${Emojis.giveaway} Recompensa diaria`,
      lines: [
        `${Emojis.dot} Ganaste: ${Emojis.money} ${Format.inlineCode(money(amount))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'Nos vemos mañana'
    }, { ephemeral: true })
  }
}

