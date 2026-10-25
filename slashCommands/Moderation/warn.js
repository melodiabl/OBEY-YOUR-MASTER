const { escapeMarkdown } = require('discord.js')
const { createWarning, requireManualWarningAccess } = require('../../src/modules/moderation')
const { t, localeFor } = require('../../handlers/i18n')

module.exports = {
  name: 'warn',
  description: 'Advertir a un miembro del servidor',
  memberpermissions: ['KickMembers'],
  options: [
    { User: { name: 'usuario', description: 'Miembro a advertir', required: true } },
    { String: { name: 'razon', description: 'Razón', required: false } },
  ],
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true })
    const locale = localeFor(client, interaction.guild.id)
    const target = interaction.options.getUser('usuario')
    const reason = interaction.options.getString('razon') || t(locale, 'moderation.noReason')
    try {
      const { caseId, count } = await createWarning(client, {
        guildId: interaction.guild.id, userId: target?.id, moderatorId: interaction.user.id, reason,
      }, {
        authorize: () => requireManualWarningAccess(client, interaction.guild, interaction.user.id, target?.id, 'slash'),
      })
      const notice = `${t(locale, 'moderationHistory.recorded')} #${caseId}${count == null ? '' : ` · ${count}`}`
      const dm = `${t(locale, 'moderationHistory.received')} ${escapeMarkdown(interaction.guild.name).slice(0, 100)}\n${escapeMarkdown(reason).slice(0, 1000)}`
      await target.send({ content: dm, allowedMentions: { parse: [] } }).catch(() => {})
      return interaction.editReply({ content: notice, allowedMentions: { parse: [] } })
    } catch {
      return interaction.editReply({ content: t(locale, 'moderationHistory.writeUnconfirmed'), allowedMentions: { parse: [] } })
    }
  },
}
