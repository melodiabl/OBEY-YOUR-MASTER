const { SlashCommandBuilder } = require('discord.js')
const systems = require('../../systems')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Envía una sugerencia al servidor')
    .addStringOption(option =>
      option.setName('sugerencia')
        .setDescription('Tu sugerencia')
        .setRequired(true)),

  async execute (client, interaction) {
    const suggestionText = interaction.options.getString('sugerencia')
    await systems.suggestions.handleSuggestion(interaction, suggestionText)
  }
}
