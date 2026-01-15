const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Vende un ítem de tu inventario')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Nombre del ítem a vender')
        .setRequired(true)
    ),
  async execute(interaction, client) {
    const itemName = interaction.options.getString('item');
    const items = {
      pan: 50,
      hacha: 100,
      caña: 150,
      elixir: 200,
      escudo: 250,
    };
    const price = items[itemName.toLowerCase()];
    if (!price) {
      return interaction.reply({ content: '❌ Ítem no válido.', ephermal: true });
    }
    const userData = await client.db.getUserData(interaction.user.id);
    userData.inventory = userData.inventory || [];
    const index = userData.inventory.indexOf(itemName);
    if (index === -1) {
      return interaction.reply({ content: '❌ No tienes este ítem en tu inventario.', ephermal: true });
    }
    userData.inventory.splice(index, 1);
    userData.money = (userData.money || 0) + Math.floor(price / 2);
    await userData.save();
    await interaction.reply(`💰 Has vendido **${itemName}** por **${Math.floor(price / 2)} monedas**.`);
  },
};
