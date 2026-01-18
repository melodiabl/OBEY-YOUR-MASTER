const { SlashCommandBuilder } = require('discord.js')
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('whatif')
    .setDescription('Sirve para hacer una pregunta al bot'),
  async execute (client, interaction) {
    await interaction.reply('Este comando aún no está implementado en slash.')
  }
}
