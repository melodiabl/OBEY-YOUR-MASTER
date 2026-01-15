const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Muestra la tienda de ítems disponibles'),
  async execute(interaction) {
    const items = [
      { name: 'Pan', price: 50 },
      { name: 'Hacha', price: 100 },
      { name: 'Caña', price: 150 },
      { name: 'Elixir', price: 200 },
      { name: 'Escudo', price: 250 },
    ];
    let msg = '🛒 **Tienda**:\n';
    for (const item of items) {
      msg += `- ${item.name}: ${item.price} monedas\n`;
    }
    await interaction.reply(msg);
  },
};
