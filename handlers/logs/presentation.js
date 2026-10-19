const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, escapeMarkdown } = require('discord.js')
const { t } = require('../i18n')
const { asFooter, asAuthor } = require('../presentation/metadata')
const { registry } = require('../assets/registry')
const { validId } = require('./snapshots')

function avatarURL(value) {
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && ['cdn.discordapp.com', 'media.discordapp.net'].includes(url.hostname) && !url.username && !url.password && /^\/(?:avatars|embed\/avatars)\//.test(url.pathname)) return url.href
  } catch { /* An absent avatar never hides the event. */ }
}
function contextButton(record, guild, copy) {
  if (record.guildId !== guild.id || !validId(record.sourceChannelId)) return null
  let label = 'openChannel', messageId
  if (record.kind === 'messageDeleted' && validId(record.contextMessageId)) { label = 'viewContext'; messageId = record.contextMessageId }
  else if (['messageEdited', 'attachmentsChanged'].includes(record.kind) && validId(record.messageId)) { label = 'viewMessage'; messageId = record.messageId }
  const button = new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(copy(label)).setEmoji(registry.emoji('icon.channel'))
    .setURL(`https://discord.com/channels/${guild.id}/${record.sourceChannelId}${messageId ? '/' + messageId : ''}`)
  return new ActionRowBuilder().addComponents(button)
}
function buildLogPayload(record, { guild, locale, reveal, content, sourceAvailable = true }) {
  const copy = key => t(locale, 'logs.' + key)
  const removedTimeout = record.kind === 'timeoutChanged' && record.timeout?.after === null
  const green = ['unbanned', 'memberJoined', 'botAdded', 'voiceJoined'].includes(record.kind) || removedTimeout
  const red = ['banned', 'kicked'].includes(record.kind)
  const icon = red ? 'icon.warning' : /Deleted/.test(record.kind) ? 'icon.delete' : /Edited|Changed|Renamed/.test(record.kind) ? 'icon.edit' : green ? 'icon.success' : 'icon.info'
  const title = copy(removedTimeout ? 'timeoutRemoved' : 'events.' + record.kind)
  const embed = new EmbedBuilder().setColor(green ? 0x57F287 : red ? 0xED4245 : 0xF0B232)
    .setTitle(`${registry.markup(icon)} ${title}`.slice(0, 256))
    .setFooter(asFooter({ text: `${String(guild.name || '').slice(0, 80)} · ${copy('categories.' + record.category)}${record.partial ? ' · ' + copy('partial') : ''}` }))
    .setTimestamp(record.occurredAt || record.observedAt)
  if (!reveal) return { embeds: [embed.setDescription(copy('restricted'))], components: [], allowedMentions: { parse: [], repliedUser: false } }
  if (validId(record.subject?.id)) embed.setAuthor(asAuthor({ name: record.subject.name || copy('unknownUser'), iconURL: avatarURL(record.subject.avatarURL) }))
  const fields = []
  const messageText = value => typeof value === 'string' ? escapeMarkdown(value).slice(0, 1000) || copy('emptyMessage') : copy('contentUnavailable')
  if (record.message) {
    if (!content) embed.setDescription(record.partial && !Object.values(record.content || {}).some(value => typeof value === 'string') ? copy('contentUnavailable') : copy('contentOmitted'))
    else if (['messageEdited', 'attachmentsChanged'].includes(record.kind)) fields.push({ key: 'contentBefore', value: messageText(record.content?.before) }, { key: 'contentAfter', value: messageText(record.content?.after) })
    else embed.setDescription(messageText(record.content?.current))
  }
  for (const field of record.fields || []) {
    if (field.key === 'attachments' && field.value === '0') continue
    fields.push(field.key === 'user' && validId(record.subject?.id) ? { key: record.message ? 'messageAuthor' : 'user', value: `<@${record.subject.id}>\n\`${record.subject.id}\`` } : field)
  }
  if (record.requiresActor) fields.splice(fields.findIndex(field => ['user', 'messageAuthor'].includes(field.key)) + 1, 0,
    { key: 'actor', value: validId(record.actorId) ? `<@${record.actorId}>\n\`${record.actorId}\`` : copy('unknownActor') })
  if (record.timeout) for (const [key, value] of Object.entries(record.timeout)) {
    if (key === 'before' && value === null && record.timeout.after > 0) continue
    fields.push({ key: key === 'before' ? 'previousTimeoutEnd' : 'timeoutEnd', value: value === null ? copy('noTimeout') : Number.isFinite(value) && value > 0 ? `<t:${Math.floor(value / 1000)}:f> · <t:${Math.floor(value / 1000)}:R>` : copy('unavailable') })
  }
  if (validId(record.auditEntryId)) fields.push({ key: 'auditEntry', value: `\`${record.auditEntryId}\`` })
  if (Number.isFinite(record.messageCreatedAt) && record.messageCreatedAt > 0) fields.push({ key: 'messageCreated', value: `<t:${Math.floor(record.messageCreatedAt / 1000)}:f>` })
  for (const field of fields.slice(0, 20)) {
    const name = copy('fields.' + field.key), available = 5900 - embed.length - name.length
    if (available < 1) break
    const value = String(field.value ?? copy('unavailable')).slice(0, Math.min(1000, available)) || copy('unavailable')
    embed.addFields({ name, value, inline: ['user', 'messageAuthor', 'actor', 'channel', 'count', 'attachments', 'timeoutEnd', 'previousTimeoutEnd'].includes(field.key) })
  }
  const context = sourceAvailable && contextButton(record, guild, copy)
  return { embeds: [embed], components: context ? [context] : [], allowedMentions: { parse: [], repliedUser: false } }
}
module.exports = { buildLogPayload }
