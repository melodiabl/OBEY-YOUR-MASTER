const { EmbedBuilder, escapeMarkdown } = require('discord.js')
const { t } = require('../i18n')
const { asFooter } = require('../presentation/metadata')
function buildLogPayload(record, { guild, locale, reveal, content }) {
  const copy = key => t(locale, 'logs.' + key)
  const color = /Deleted|Left|banned|kicked/i.test(record.kind) ? 0xED4245 : /Created|Joined|Added/i.test(record.kind) ? 0x57F287 : 0xFEE75C
  const embed = new EmbedBuilder().setColor(color).setTitle(copy('events.' + record.kind))
    .setDescription(copy(reveal ? 'observed' : 'restricted'))
    .setFooter(asFooter({ text: `${String(guild.name || '').slice(0, 100)} · ${copy('categories.' + record.category)}${record.partial ? ' · ' + copy('partial') : ''}` }))
    .setTimestamp(record.observedAt)
  const fields = reveal ? [...(record.fields || [])] : []
  if (reveal && record.requiresActor) fields.push({ key: 'actor', value: record.actorId ? `<@${record.actorId}>` : copy('unknownActor') })
  if (reveal && record.message) {
    if (content) for (const [key, value] of Object.entries(record.content || {})) {
      fields.push({ key: key === 'before' ? 'contentBefore' : key === 'after' ? 'contentAfter' : 'content', value: typeof value === 'string' ? escapeMarkdown(value).slice(0, 1000) || copy('emptyMessage') : copy('unavailable') })
    }
    else fields.push({ key: 'content', value: copy('contentOmitted') })
  }
  let remaining = 4700
  for (const field of fields.slice(0, 20)) {
    const name = copy('fields.' + field.key), value = String(field.value ?? copy('unavailable')).slice(0, Math.min(1000, remaining - name.length)) || copy('unavailable')
    if (remaining < name.length + value.length) break
    embed.addFields({ name, value }); remaining -= name.length + value.length
  }
  return { embeds: [embed], allowedMentions: { parse: [], repliedUser: false } }
}
module.exports = { buildLogPayload }
