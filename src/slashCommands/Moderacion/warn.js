const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const { warnUser, handleWarnThresholdKick } = require('../../systems').moderation
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advierte a un usuario')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('El usuario a advertir')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('razon')
        .setDescription('Razón de la advertencia')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || 'No se proporcionó una razón.'

    if (target.bot) return interaction.reply({ content: `${Emojis.error} No puedes advertir a un bot.`, ephemeral: true })

    try {
      const res = await warnUser({
        guildID: interaction.guild.id,
        targetID: target.id,
        moderatorID: interaction.user.id,
        reason
      })

      const embed = new EmbedBuilder()
        .setTitle(`${Emojis.warn} Usuario Advertido`)
        .setColor('Yellow')
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: `${Emojis.member} Usuario`, value: `${target.tag} (${Format.inlineCode(target.id)})`, inline: true },
          { name: `${Emojis.owner} Moderador`, value: `${interaction.user.tag}`, inline: true },
          { name: `${Emojis.stats} Advertencias Totales`, value: Format.inlineCode(res.warnsCount.toString()), inline: true },
          { name: `${Emojis.quote} Razón`, value: Format.quote(reason) }
        )
        .setTimestamp()

      await interaction.reply({ embeds: [embed] })

      // Política: 3 warns => kick (base).
      const policy = await handleWarnThresholdKick({
        client,
        guild: interaction.guild,
        targetID: target.id,
        moderatorID: interaction.user.id,
        warnsCount: res.warnsCount,
        threshold: 3
      })

      if (policy.triggered && !policy.kicked && policy.reason) {
        await interaction.followUp({ content: `${Emojis.warn} Alcanzó 3 warns, pero no pude kickear: ${Format.inlineCode(policy.reason)}`, ephemeral: true })
      }
      if (policy.kicked) {
        await interaction.followUp({ content: `${Emojis.success} Auto-kick aplicado a <@${target.id}> por llegar a **3** warns.`, ephemeral: false })
      }

      try {
        await target.send({
          content: `${Emojis.warn} Has sido advertido en **${interaction.guild.name}**.\n${Emojis.quote} **Razón:** ${reason}\n${Emojis.stats} **Total:** ${res.warnsCount}`
        })
      } catch (err) {
        // Ignorar si no se puede enviar DM
      }
    } catch (e) {
      return interaction.reply({ content: `${Emojis.error} Error al advertir: ${Format.inlineCode(e.message)}`, ephemeral: true })
    }
  }
}
