const { SlashCommandBuilder } = require('discord.js')
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Transfiere dinero a otro usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario que recibirá el dinero')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a transferir')
        .setRequired(true)
    ),
  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario')
    const amount = interaction.options.getInteger('cantidad')
    const senderData = await client.db.getUserData(interaction.user.id)
    if (amount <= 0 || (senderData.money || 0) < amount) {
      return interaction.reply({ content: '❌ No tienes suficiente dinero para transferir.', ephermal: true })
    }
    senderData.money -= amount
    const receiverData = await client.db.getUserData(target.id)
    receiverData.money = (receiverData.money || 0) + amount
    await senderData.save()
    await receiverData.save()
    await interaction.reply(`💸 Has enviado **${amount} monedas** a ${target.username}.`)
  }
}
