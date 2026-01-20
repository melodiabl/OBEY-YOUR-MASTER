const { EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  DESCRIPTION: 'Reclama tu recompensa diaria',
  ALIASES: ['diario'],
  async execute (client, message) {
    const userData = await client.db.getUserData(message.author.id)
    const now = Date.now()
    const cooldownTime = 24 * 60 * 60 * 1000

    if (userData.dailyCooldown && userData.dailyCooldown > now) {
      const diff = userData.dailyCooldown - now
      const hours = Math.ceil(diff / (1000 * 60 * 60))
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription(`${Emojis.error} Vuelve en ${Format.bold(hours + ' horas')} para reclamar tu recompensa diaria.`)
        ]
      })
    }

    const amount = Math.floor(Math.random() * 201) + 100
    userData.money = (userData.money || 0) + amount
    userData.dailyCooldown = now + cooldownTime
    await userData.save()

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.giveaway} Recompensa Diaria`)
      .setDescription(`¡Felicidades! Has reclamado tu recompensa diaria y obtenido ${Emojis.money} ${Format.bold(amount.toLocaleString())} monedas.`)
      .addFields({ name: 'Cartera Total', value: `${Emojis.dot} ${Format.inlineCode(userData.money.toLocaleString())}` })
      .setColor('Gold')
      .setTimestamp()

    message.reply({ embeds: [embed] })
  }
}
