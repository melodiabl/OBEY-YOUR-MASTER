const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Muestra información sobre el servidor'),
  async execute(interaction) {
    const guild = interaction.guild;
    const info = `Nombre: ${guild.name}\nMiembros: ${guild.memberCount}`;
    await interaction.reply(info);
  },
};
