const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Deposita dinero en el banco')
    .addIntegerOption(option =>
      option.setName('cantidad')
        .setDescription('Cantidad a depositar')
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const amount = interaction.options.getInteger('cantidad');
    const userData = await client.db.getUserData(interaction.user.id);
    if (amount <= 0 || (userData.money || 0) < amount) {
      return interaction.reply({ content: '❌ No tienes suficiente dinero en mano.', ephermal: true });
    }
    userData.money -= amount;
    userData.bank = (userData.bank || 0) + amount;
    await userData.save();
    await interaction.reply(`🏦 Has depositado **${amount} monedas** en tu banco.`);
  },
};
