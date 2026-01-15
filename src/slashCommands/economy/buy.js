const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Compra un ítem de la tienda')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Nombre del ítem a comprar')
        .setRequired(true)
    ),
  async execute(client, interaction) {
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
    if ((userData.money || 0) < price) {
      return interaction.reply({ content: '❌ No tienes suficiente dinero para comprar este ítem.', ephermal: true });
    }
    userData.money -= price;
    userData.inventory = userData.inventory || [];
    userData.inventory.push(itemName);
    await userData.save();
    await interaction.reply(`🛍️ Has comprado **${itemName}** por **${price} monedas**.`);
  },
};
