const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('pet-feed')
    .setDescription('Alimenta a tu mascota (Cuesta 50 monedas)'),

  async execute (client, interaction) {
    const cost = 50
    const userData = await UserSchema.findOne({ userID: interaction.user.id })

    if (!userData || !userData.pet || !userData.pet.name) {
      return interaction.reply({ content: 'No tienes ninguna mascota que alimentar. Usa `/pet-adopt` primero.', ephemeral: true })
    }

    if (userData.money < cost) {
      return interaction.reply({ content: `No tienes suficientes monedas. Alimentar a tu mascota cuesta **${cost}** monedas.`, ephemeral: true })
    }

    userData.money -= cost
    userData.pet.health = Math.min(100, userData.pet.health + 20)
    userData.pet.lastFed = new Date()

    await userData.save()

    const embed = new EmbedBuilder()
      .setTitle('🍖 ¡Mascota Alimentada!')
      .setDescription(`Has alimentado a **${userData.pet.name}**. Su salud ahora es de **${userData.pet.health}/100**.`)
      .setColor('Green')
      .setFooter({ text: `Gastaste ${cost} monedas.` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}
