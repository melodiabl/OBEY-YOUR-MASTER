const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const ms = require('ms')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Silencia a un usuario temporalmente')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario a silenciar')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duracion')
        .setDescription('Duración (ej: 10m, 1h, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón del silencio')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute (client, interaction) {
    const target = interaction.options.getMember('usuario')
    const durationStr = interaction.options.getString('duracion')
    const reason = interaction.options.getString('razon') || 'No se proporcionó una razón.'

    if (!target) return interaction.reply({ content: `${Emojis.error} El usuario no está en el servidor.`, ephemeral: true })
    if (target.user.bot) return interaction.reply({ content: `${Emojis.error} No puedes silenciar a un bot.`, ephemeral: true })

    const duration = ms(durationStr)
    if (!duration || duration < 5000 || duration > 2419200000) {
      return interaction.reply({
        content: `${Emojis.error} Duración inválida. Debe ser entre 5 segundos y 28 días (ej: 10m, 1h, 1d).`,
        ephemeral: true
      })
    }

    if (!target.manageable || !target.moderatable) {
      return interaction.reply({ content: `${Emojis.error} No tengo permisos suficientes para silenciar a este usuario.`, ephemeral: true })
    }

    try {
      await target.timeout(duration, reason)

      const embed = new EmbedBuilder()
        .setTitle(`${Emojis.moderation} Usuario Silenciado`)
        .setColor('Greyple')
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
          { name: `${Emojis.member} Usuario`, value: `${target.user.tag} (${Format.inlineCode(target.id)})`, inline: true },
          { name: `${Emojis.loading} Duración`, value: Format.inlineCode(durationStr), inline: true },
          { name: `${Emojis.owner} Moderador`, value: `${interaction.user.tag}`, inline: true },
          { name: `${Emojis.quote} Razón`, value: Format.quote(reason) }
        )
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })
    } catch (err) {
      return interaction.reply({ content: `${Emojis.error} Error al silenciar: ${Format.inlineCode(err.message)}`, ephemeral: true })
    }
  }
}
