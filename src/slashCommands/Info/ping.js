const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra el ping del bot'),
  async execute(interaction, client) {
    await interaction.reply(`🏓 ${client.ws.ping}ms`);
  },
};
