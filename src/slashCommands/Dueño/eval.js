const { SlashCommandBuilder } = require('discord.js')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Ejecuta código remoto (solo OWNER)')
    .addStringOption(option =>
      option
        .setName('code')
        .setDescription('Código a ejecutar')
        .setRequired(true)
    ),
  // Protección real: el middleware valida OWNER_IDS.
  OWNER: true,
  async execute (client, interaction) {
    // Seguridad: eval remoto deshabilitado por defecto.
    // Si lo habilitas, hacelo con whitelist estricta y logs.
    await interaction.reply({ content: 'Eval remoto deshabilitado por seguridad.', ephemeral: true })
  }
}
