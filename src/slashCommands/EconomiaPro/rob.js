const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Intenta robarle dinero a otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario al que quieres robar')
        .setRequired(true)),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario')

    if (target.id === interaction.user.id) return interaction.reply({ content: 'No puedes robarte a ti mismo.', ephemeral: true })
    if (target.bot) return interaction.reply({ content: 'No puedes robarle a un bot.', ephemeral: true })

    const userData = await UserSchema.findOne({ userID: interaction.user.id })
    const targetData = await UserSchema.findOne({ userID: target.id })

    if (!userData || userData.money < 100) return interaction.reply({ content: 'Necesitas al menos 100 monedas para intentar un robo.', ephemeral: true })
    if (!targetData || targetData.money < 100) return interaction.reply({ content: 'El usuario no tiene suficiente dinero para que valga la pena el robo.', ephemeral: true })

    const success = Math.random() > 0.7 // 30% de éxito

    if (success) {
      const stolenAmount = Math.floor(Math.random() * (targetData.money * 0.3)) + 50
      userData.money += stolenAmount
      targetData.money -= stolenAmount

      await userData.save()
      await targetData.save()

      const successEmbed = new EmbedBuilder()
        .setTitle('🥷 ¡Robo Exitoso!')
        .setDescription(`Le has robado **${stolenAmount}** monedas a ${target}.`)
        .setColor('Green')
        .setTimestamp()

      await interaction.reply({ embeds: [successEmbed] })
    } else {
      const fine = 100
      userData.money -= fine
      await userData.save()

      const failEmbed = new EmbedBuilder()
        .setTitle('👮 ¡Te atraparon!')
        .setDescription(`Has fallado el robo y pagaste una multa de **${fine}** monedas.`)
        .setColor('Red')
        .setTimestamp()

      await interaction.reply({ embeds: [failEmbed] })
    }
  }
}
