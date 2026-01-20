const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Reclama tu recompensa diaria'),
  async execute (client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id)
    const now = Date.now()
    const cooldownTime = 24 * 60 * 60 * 1000

    if (userData.dailyCooldown && userData.dailyCooldown > now) {
      const diff = userData.dailyCooldown - now
      const hours = Math.ceil(diff / (1000 * 60 * 60))
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription(`${Emojis.error} Debes esperar ${Format.bold(hours + ' horas')} para volver a reclamar tu recompensa diaria.`)
        ],
        ephemeral: true
      })
    }

    const amount = Math.floor(Math.random() * 201) + 100
    userData.money = (userData.money || 0) + amount
    userData.dailyCooldown = now + cooldownTime
    await userData.save()

    const embed = new EmbedBuilder()
      .setTitle(`${Emojis.giveaway} Recompensa Diaria`)
      .setDescription(`🎁 ¡Has reclamado tu recompensa diaria y obtenido ${Emojis.money} ${Format.bold(amount.toLocaleString())} monedas!`)
      .addFields({ name: 'Cartera Total', value: `${Emojis.dot} ${Format.inlineCode(userData.money.toLocaleString())}` })
      .setColor('Gold')
      .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
