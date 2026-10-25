const { EmbedBuilder, escapeMarkdown } = require('discord.js')
const { t } = require('../../../../handlers/i18n')

const safe = (value, limit) => escapeMarkdown((typeof value === 'string' ? value : '').slice(0, limit)).slice(0, limit).toWellFormed()

function pageEmbed(locale, { rows, total, page, perPage, targetId, detail, legacy, guilds }) {
  const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(t(locale, 'moderationHistory.title'))
  embed.addFields({ name: t(locale, 'moderation.user'), value: targetId })
  const lines = rows.map(row => {
    const label = legacy ? `#${row.index}` : Number.isSafeInteger(row.caseId) && row.caseId > 0 ? `#${row.caseId}` : t(locale, 'moderationHistory.noCaseNumber')
    const scope = legacy ? safe(guilds.get(row.guild)?.name || row.guild, 64) : safe(row.action, 20)
    const reason = safe(row.reason, detail ? 3000 : 256) || t(locale, 'moderation.noReason')
    const when = legacy && row.sourceKind !== 'native' ? safe(row.when, 64)
      : Number.isFinite(new Date(row.createdAt).getTime()) ? new Date(row.createdAt).toISOString() : ''
    return `**${label} · ${scope}**\n${reason}${when ? `\n${when}` : ''}`
  })
  const body = lines.join('\n\n') || t(locale, 'moderationHistory.empty')
  embed.setDescription(body)
  if (legacy) embed.addFields({ name: t(locale, 'moderationHistory.availability'), value: t(locale, 'moderationHistory.legacyNotice') })
  embed.setFooter({ text: t(locale, 'moderationHistory.page', { page, pages: Math.max(1, Math.ceil(total / perPage)), total }) })
  return { embeds: [embed], allowedMentions: { parse: [], repliedUser: false } }
}

module.exports = { pageEmbed }
