const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Muestra el avatar de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('Usuario cuyo avatar quieres ver')
        .setRequired(false)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    await interaction.reply({ content: user.displayAvatarURL({ dynamic: true }), ephermal: false });
  },
};
