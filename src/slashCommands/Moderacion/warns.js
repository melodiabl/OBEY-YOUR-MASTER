const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Muestra las advertencias de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario para ver sus advertencias')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user

    const userData = await UserSchema.findOne({ userID: target.id })

    if (!userData || !userData.warns || userData.warns.length === 0) {
      return interaction.reply({ content: `${target.tag} no tiene advertencias.`, ephemeral: true })
    }

    const embed = new EmbedBuilder()
      .setTitle(`Advertencias de ${target.tag}`)
      .setColor('Blue')
      .setThumbnail(target.displayAvatarURL())
      .setDescription(userData.warns.map((w, i) =>
        `**#${i + 1}** | Moderador: <@${w.moderator}>\n**Razón:** ${w.reason}\n**Fecha:** ${new Date(w.date).toLocaleDateString()}`
      ).join('\n\n'))
      .setFooter({ text: `Total: ${userData.warns.length} advertencias` })

    await interaction.reply({ embeds: [embed] })
  }
}
