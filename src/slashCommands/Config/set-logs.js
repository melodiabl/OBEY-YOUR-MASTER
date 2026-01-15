const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const GuildSchema = require('../../database/schemas/GuildSchema');

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('set-logs')
    .setDescription('Configura el canal de logs de auditoría')
    .addChannelOption(option => 
      option.setName('canal')
        .setDescription('El canal para los logs')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const channel = interaction.options.getChannel('canal');

    let guildData = await GuildSchema.findOne({ guildID: interaction.guild.id });
    if (!guildData) guildData = new GuildSchema({ guildID: interaction.guild.id });

    guildData.logsChannel = channel.id;
    await guildData.save();

    await interaction.reply({ content: `✅ Canal de logs configurado en <#${channel.id}>.`, ephemeral: true });
  }
};
