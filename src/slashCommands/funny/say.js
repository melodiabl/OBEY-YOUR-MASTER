const { SlashCommandBuilder } = require('discord.js')
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Hacer que el bot diga algo')
    .addStringOption(option =>
      option.setName('texto')
        .setDescription('Escribe aqui el texto que enviara el bot')
        .setRequired(true)
    ),

  async execute (client, interaction, prefix) {
    const texto = interaction.options.getString('texto')

    interaction.reply({ content: texto })
  }
}
