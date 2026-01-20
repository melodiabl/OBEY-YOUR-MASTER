const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Trabaja para ganar monedas'),
  async execute (client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id)
    const now = Date.now()
    const cooldownTime = 60 * 60 * 1000

    if (userData.workCooldown && userData.workCooldown > now) {
      const diff = userData.workCooldown - now
      const minutes = Math.ceil(diff / 60000)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription(`${Emojis.error} Debes esperar ${Format.bold(minutes + ' minutos')} para volver a trabajar.`)
        ],
        ephemeral: true
      })
    }

    const amount = Math.floor(Math.random() * 51) + 50
    userData.money = (userData.money || 0) + amount
    userData.workCooldown = now + cooldownTime
    await userData.save()

    // Sistema de Quests
    try {
      const { incWork } = require('../../systems').quests
      await incWork({ guildID: interaction.guild.id, userID: interaction.user.id, n: 1 })
    } catch (e) {}

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.work} Trabajo Completado`)
      .setDescription(`¡Buen trabajo! Has ganado ${Emojis.money} ${Format.bold(amount.toLocaleString())} monedas.`)
      .addFields({ name: 'Cartera Total', value: `${Emojis.dot} ${Format.inlineCode(userData.money.toLocaleString())}` })
      .setColor('Green')
      .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
      .setTimestamp()

    return interaction.reply({ embeds: [embed] })
  }
}
