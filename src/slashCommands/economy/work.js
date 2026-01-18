const { SlashCommandBuilder } = require('discord.js')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Trabaja para ganar monedas'),
  async execute (client, interaction) {
    const userData = await client.db.getUserData(interaction.user.id)
    const cooldown = userData.workCooldown || 0
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    if (cooldown && now - cooldown < oneHour) {
      const remaining = Math.ceil((oneHour - (now - cooldown)) / 60000)
      return interaction.reply({ content: `ƒ?ü Debes esperar ${remaining} minutos para volver a trabajar.`, ephemeral: true })
    }

    const amount = Math.floor(Math.random() * 51) + 50 // 50-100
    userData.money = (userData.money || 0) + amount
    userData.workCooldown = now
    await userData.save()

    // Sistema de Quests (base): progreso por /work
    try {
      const { incWork } = require('../../systems').quests
      await incWork({ guildID: interaction.guild.id, userID: interaction.user.id, n: 1 })
    } catch (e) {}

    return interaction.reply(`ĐY>ÿ‹÷? Has trabajado y ganado **${amount} monedas**. Tienes ahora **${userData.money}** monedas.`)
  }
}
