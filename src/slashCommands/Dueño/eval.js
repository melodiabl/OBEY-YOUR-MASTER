const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Ejecuta código de forma remota (Solo para el dueño)')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Código a ejecutar')
        .setRequired(true)
    ),
  async execute(interaction) {
    // Este comando debe ser protegido y solo ejecutado por el dueño
    // Aquí no implementamos la lógica para evitar riesgos
    await interaction.reply({ content: '⚠️ Este comando solo puede ser ejecutado por el dueño.', ephermal: true });
  },
};
