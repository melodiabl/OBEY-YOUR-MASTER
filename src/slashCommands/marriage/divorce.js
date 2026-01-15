const { SlashCommandBuilder } = require('discord.js');
const { divorce } = require('../../utils/marriageManager');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('divorce')
    .setDescription('Solicita un divorcio'),
  async execute(client, interaction) {
    const ok = await divorce(interaction.user.id);
    if (!ok) {
      return interaction.reply({ content: '❌ No estás casado/a.', ephermal: true });
    }
    await interaction.reply('💔 Has finalizado tu matrimonio.');
  },
};
