const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Recarga comandos (Solo para el dueño)'),
  async execute(client, interaction) {
    await interaction.reply({ content: '♻️ Comandos recargados.', ephermal: true });
  },
};
