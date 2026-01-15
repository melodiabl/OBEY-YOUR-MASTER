const { SlashCommandBuilder } = require('discord.js');
const { stop } = require('../../music/musicManager');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la música y limpia la cola'),
  async execute(client, interaction) {
    const success = stop(interaction.guild.id);
    if (!success) {
      return interaction.reply({ content: '❌ No hay canciones reproduciéndose.', ephermal: true });
    }
    await interaction.reply('🛑 Música detenida y cola limpiada.');
  },
};
