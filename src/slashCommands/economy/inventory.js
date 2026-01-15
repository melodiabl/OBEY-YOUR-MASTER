const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Muestra el inventario de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario cuyo inventario quieres ver')
        .setRequired(false)
    ),
  async execute(interaction, client) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const userData = await client.db.getUserData(user.id);
    const items = userData.inventory || [];
    if (!items.length) {
      return interaction.reply(`${user.username} no tiene ítems en su inventario.`);
    }
    await interaction.reply(`🎒 Inventario de ${user.username}:\n- ${items.join('\n- ')}`);
  },
};
