const { SlashCommandBuilder } = require('discord.js');
const { skip } = require('../../music/musicManager');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la canción actual'),
  async execute(client, interaction) {
    const success = skip(interaction.guild.id);
    if (!success) {
      return interaction.reply({ content: '❌ No hay canciones en la cola.', ephermal: true });
    }
    await interaction.reply('⏭️ Canción saltada.');
  },
};
