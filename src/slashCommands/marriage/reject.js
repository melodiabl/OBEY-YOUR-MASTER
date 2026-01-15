const { SlashCommandBuilder } = require('discord.js');
const { rejectMarriage } = require('../../utils/marriageManager');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('reject')
    .setDescription('Rechaza una propuesta de matrimonio pendiente'),
  async execute(client, interaction) {
    const ok = await rejectMarriage(interaction.user.id);
    if (!ok) {
      return interaction.reply({ content: '❌ No tienes propuestas pendientes.', ephermal: true });
    }
    await interaction.reply('❌ Has rechazado la propuesta de matrimonio.');
  },
};
