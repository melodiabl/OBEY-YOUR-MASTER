const { SlashCommandBuilder } = require('discord.js')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Recarga eventos/handlers/comandos (solo OWNER)'),
  // Protección real: el middleware valida OWNER_IDS.
  OWNER: true,
  async execute (client, interaction) {
    try {
      await client.loadEvents()
      await client.loadHandlers()
      await client.loadCommands()
      await client.loadSlashCommands()
      await interaction.reply({ content: 'Reload completo realizado.', ephemeral: true })
    } catch (e) {
      const msg = e?.message || String(e || 'Error desconocido')
      await interaction.reply({ content: `Error en reload: ${msg}`, ephemeral: true })
    }
  }
}
