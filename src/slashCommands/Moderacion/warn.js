const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js')
const { warnUser, handleWarnThresholdKick } = require('../../systems').moderation

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

    if (target.bot) return interaction.reply({ content: 'No puedes advertir a un bot.', ephemeral: true })

    const res = await warnUser({
      guildID: interaction.guild.id,
      targetID: target.id,
      moderatorID: interaction.user.id,
      reason
    })

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Usuario Advertido')
      .setColor('Yellow')
      .addFields(
        { name: 'Usuario', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Moderador', value: `${interaction.user.tag}`, inline: true },
        { name: 'Razón', value: reason },
        { name: 'Total de Advertencias', value: `${res.warnsCount}` }
      )
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })

    // Política: 3 warns => kick (base).
    try {
      const policy = await handleWarnThresholdKick({
        client,
        guild: interaction.guild,
        targetID: target.id,
        moderatorID: interaction.user.id,
        warnsCount: res.warnsCount,
        threshold: 3
      })
      if (policy.triggered && !policy.kicked && policy.reason) {
        await interaction.followUp({ content: `⚠️ Alcanzó 3 warns, pero no pude kickear: ${policy.reason}`, ephemeral: true })
      }
      if (policy.kicked) {
        await interaction.followUp({ content: `✅ Auto-kick aplicado a <@${target.id}> por llegar a **3** warns.`, ephemeral: false })
      }
    } catch (e) {
      await interaction.followUp({ content: `⚠️ Alcanzó 3 warns, pero falló el auto-kick: ${e?.message || e}`, ephemeral: true })
    }

    try {
      await target.send({ content: `Has sido advertido en **${interaction.guild.name}**.\nRazón: ${reason}` })
    } catch (err) {
      console.log('No se pudo enviar el DM al usuario.')
    }
  }
}
