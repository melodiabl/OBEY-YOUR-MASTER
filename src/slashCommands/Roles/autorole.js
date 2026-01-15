const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const GuildSchema = require('../../database/schemas/GuildSchema');

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configura un rol automático para los nuevos miembros')
    .addRoleOption(option => 
      option.setName('rol')
        .setDescription('El rol que se dará automáticamente')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(client, interaction) {
    const role = interaction.options.getRole('rol');

    if (role.managed) return interaction.reply({ content: 'No puedo asignar un rol gestionado por una integración.', ephemeral: true });
    
    let guildData = await GuildSchema.findOne({ guildID: interaction.guild.id });
    if (!guildData) {
      guildData = new GuildSchema({ guildID: interaction.guild.id });
    }

    guildData.autoRole = role.id;
    await guildData.save();

    const embed = new EmbedBuilder()
      .setTitle('✅ Auto-Rol Configurado')
      .setDescription(`Ahora los nuevos miembros recibirán automáticamente el rol: ${role}`)
      .setColor('Green')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
