const { SlashCommandBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyOk, replyWarn } = require('../../core/ui/interactionKit')
const { money } = require('./_catalog')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Trabaja para ganar monedas (cooldown)'),

  async execute (client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id)
    const now = Date.now()
    const cooldownTime = 60 * 60 * 1000

    if (userData.workCooldown && userData.workCooldown > now) {
      const ts = Math.floor(userData.workCooldown / 1000)
      return replyWarn(client, interaction, {
        system: 'economy',
        title: 'Cooldown',
        lines: [
          `${Emojis.dot} Podrás volver a trabajar: <t:${ts}:R>`,
          `${Emojis.dot} Tip: prueba ${Format.inlineCode('/daily')}.`
        ]
      }, { ephemeral: true })
    }

    const amount = Math.floor(Math.random() * 51) + 50
    userData.money = (userData.money || 0) + amount
    userData.workCooldown = now + cooldownTime
    await userData.save()

    return replyOk(client, interaction, {
      system: 'economy',
      title: `${Emojis.work} Turno completado`,
      lines: [
        `${Emojis.dot} Ganaste: ${Emojis.money} ${Format.inlineCode(money(amount))}`,
        `${Emojis.dot} Efectivo: ${Format.inlineCode(money(userData.money || 0))}`
      ],
      signature: 'Buen trabajo'
    }, { ephemeral: true })
  }
}

