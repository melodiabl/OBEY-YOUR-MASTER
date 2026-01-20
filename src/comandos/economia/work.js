const { EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  DESCRIPTION: 'Trabaja una vez cada hora para ganar monedas',
  ALIASES: ['trabajar'],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    const now = Date.now()
    const cooldownTime = 60 * 60 * 1000 // 1 hora

    if (userData.workCooldown && userData.workCooldown > now) {
      const diff = userData.workCooldown - now
      const minutes = Math.ceil(diff / 60000)
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription(`${Emojis.error} Debes esperar ${Format.bold(minutes + ' minutos')} antes de volver a trabajar.`)
        ]
      })
    }

    const amount = Math.floor(Math.random() * 51) + 50
    userData.money = (userData.money || 0) + amount
    userData.workCooldown = now + cooldownTime
    await userData.save()

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.work} Turno Terminado`)
      .setDescription(`¡Has trabajado duro y ganado ${Emojis.money} ${Format.bold(amount.toLocaleString())} monedas!`)
      .addFields({ name: 'Cartera Total', value: `${Emojis.dot} ${Format.inlineCode(userData.money.toLocaleString())}` })
      .setColor('Green')
      .setTimestamp()

    message.reply({ embeds: [embed] })
  }
}
