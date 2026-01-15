const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Muestra tu saldo')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Ver el saldo de otro usuario')
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const userData = await client.db.getUserData(user.id);
    await interaction.reply({
      content:
        `💰 **Saldo de ${user.username}**\n` +
        `🪙 Dinero en mano: **${userData.money || 0}**\n` +
        `🏦 Banco: **${userData.bank || 0}**`,
      ephermal: false,
    });
  },
};
