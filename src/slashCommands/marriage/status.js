const { SlashCommandBuilder } = require('discord.js')
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Muestra tu estado de matrimonio')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario cuyo estado quieres ver')
        .setRequired(false)
    ),
  async execute (client, interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user
    const userData = await client.db.getUserData(user.id)
    const partnerId = userData.partner
    if (!partnerId) {
      return interaction.reply(`${user.username} está soltero/a.`)
    }
    await interaction.reply(`${user.username} está casado con <@${partnerId}>.`)
  }
}
