const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildSchema = require('../../database/schemas/GuildSchema');

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('set-ai-channel')
    .setDescription('Configura el canal donde el bot responderá automáticamente con IA')
    .addChannelOption(option => 
      option.setName('canal')
        .setDescription('El canal para el chatbot')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const channel = interaction.options.getChannel('canal');

    let guildData = await GuildSchema.findOne({ guildID: interaction.guild.id });
    if (!guildData) {
      guildData = new GuildSchema({ guildID: interaction.guild.id });
    }

    guildData.aiChannel = channel.id;
    await guildData.save();

    await interaction.reply({ content: `✅ El canal de IA ha sido configurado en <#${channel.id}>.`, ephemeral: true });
  }
};
