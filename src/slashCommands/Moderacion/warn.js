const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const UserSchema = require('../../database/schemas/UserSchema');

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advierte a un usuario')
    .addUserOption(option => 
      option.setName('usuario')
        .setDescription('El usuario a advertir')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('razon')
        .setDescription('Razón de la advertencia')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(client, interaction) {
    const target = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('razon') || 'No se proporcionó una razón.';

    if (target.bot) return interaction.reply({ content: 'No puedes advertir a un bot.', ephemeral: true });

    let userData = await UserSchema.findOne({ userID: target.id });
    if (!userData) {
      userData = new UserSchema({ userID: target.id });
    }

    const warnData = {
      moderator: interaction.user.id,
      reason: reason,
      date: new Date()
    };

    userData.warns.push(warnData);
    await userData.save();

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Usuario Advertido')
      .setColor('Yellow')
      .addFields(
        { name: 'Usuario', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Moderador', value: `${interaction.user.tag}`, inline: true },
        { name: 'Razón', value: reason },
        { name: 'Total de Advertencias', value: `${userData.warns.length}` }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    try {
      await target.send({ content: `Has sido advertido en **${interaction.guild.name}**.\nRazón: ${reason}` });
    } catch (err) {
      console.log('No se pudo enviar el DM al usuario.');
    }
  }
};
