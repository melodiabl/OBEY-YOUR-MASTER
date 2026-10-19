const { AuditLogEvent, PermissionFlagsBits: F, GatewayIntentBits: I, escapeMarkdown } = require('discord.js')
const { createHash, randomUUID } = require('node:crypto')
const { validId, userSnapshot, messageSnapshot, timeoutValue } = require('./snapshots')
const field = (key, value) => ({ key, value: String(value ?? '—').slice(0, 1000) })
const label = value => `${escapeMarkdown(String(value?.globalName || value?.username || value?.name || '—')).slice(0, 180)}${value?.id ? ` · \`${value.id}\`` : ''}`
const date = value => Number.isFinite(Number(value)) && Number(value) > 0 ? `<t:${Math.floor(Number(value) / 1000)}:f>` : '—'

function attachLogEvents(client, service) {
  const listeners = []
  const seenAuditEntries = new Map()
  const hasAudit = guild => Boolean(guild?.members?.me?.permissions.has(F.ViewAuditLog) && client.options?.intents?.has(I.GuildModeration))
  const emit = (guild, category, kind, fields, extra = {}) => {
    if (!guild?.id) return
    void service.emit({ guildId: guild.id, category, kind, fields, ...extra }).catch(() => console.warn(JSON.stringify({ event: 'guild_log_capture_failed', entryPoint: 'gateway', requestId: randomUUID(), code: 'delivery_pipeline_failed' })))
  }
  const on = (event, run) => {
    const listener = (...args) => {
      try { run(...args) }
      catch { console.warn(JSON.stringify({ event: 'guild_log_capture_failed', entryPoint: event, requestId: randomUUID(), code: 'partial_or_invalid_event' })) }
    }
    client.on(event, listener); listeners.push([event, listener])
  }
  const channelEvent = (channel, kind, fields) => emit(channel?.guild, 'server', kind, fields, { sourceChannelId: channel.id, requiresActor: true })
  on('channelCreate', channel => channelEvent(channel, 'channelCreated', [field('channel', label(channel)), field('type', channel.type)]))
  on('channelDelete', channel => channelEvent(channel, 'channelDeleted', [field('channel', label(channel)), field('type', channel.type)]))
  on('channelPinsUpdate', channel => channelEvent(channel, 'pinsChanged', [field('channel', label(channel))]))
  on('channelUpdate', (before, after) => {
    if (before.name !== after.name) channelEvent(after, 'channelRenamed', [field('before', label(before)), field('after', label(after))])
    if (before.type !== after.type) channelEvent(after, 'channelTypeChanged', [field('channel', label(after)), field('before', before.type), field('after', after.type)])
    if (before.topic !== after.topic) channelEvent(after, 'channelTopicChanged', [field('channel', label(after))])
  })
  for (const [event, kind] of [['emojiCreate', 'emojiCreated'], ['emojiDelete', 'emojiDeleted']]) on(event, emoji => emit(emoji.guild, 'server', kind, [field('emoji', label(emoji))], { requiresActor: true }))
  on('emojiUpdate', (before, after) => { if (before.name !== after.name) emit(after.guild, 'server', 'emojiRenamed', [field('before', label(before)), field('after', label(after))], { requiresActor: true }) })
  for (const [event, kind] of [['roleCreate', 'roleCreated'], ['roleDelete', 'roleDeleted']]) on(event, role => emit(role.guild, 'server', kind, [field('details', label(role))], { requiresActor: true }))
  on('roleUpdate', (before, after) => {
    if (before.name !== after.name) emit(after.guild, 'server', 'roleRenamed', [field('before', label(before)), field('after', label(after))], { requiresActor: true })
    if (before.color !== after.color) emit(after.guild, 'server', 'roleColorChanged', [field('details', label(after)), field('before', before.hexColor || before.color), field('after', after.hexColor || after.color)], { requiresActor: true })
    if (before.permissions?.bitfield !== after.permissions?.bitfield) emit(after.guild, 'server', 'rolePermissionsChanged', [field('details', label(after)), field('before', before.permissions?.bitfield), field('after', after.permissions?.bitfield)], { requiresActor: true })
  })
  on('guildMemberAdd', member => emit(member.guild, 'members', member.user?.bot ? 'botAdded' : 'memberJoined', [field('user', label(member.user || member)), field('accountCreated', date(member.user?.createdTimestamp))], { subject: userSnapshot(member.user, member.id), partial: !member.user }))
  on('guildMemberRemove', member => emit(member.guild, 'members', 'memberLeft', [field('user', label(member.user || member))], { subject: userSnapshot(member.user, member.id), partial: !member.user }))
  on('guildMemberUpdate', (before, after) => {
    const oldRoles = [...(before.roles?.cache?.keys() || [])], newRoles = [...(after.roles?.cache?.keys() || [])]
    const added = newRoles.filter(id => !oldRoles.includes(id)), removed = oldRoles.filter(id => !newRoles.includes(id))
    if (added.length || removed.length) emit(after.guild, 'members', 'memberRolesChanged', [field('user', label(after.user || after)),
      ...(!before.partial && !after.partial ? [field('rolesAdded', added.slice(0, 20).map(id => `<@&${id}>`).join(', ') || '—'), field('rolesRemoved', removed.slice(0, 20).map(id => `<@&${id}>`).join(', ') || '—')] : [])], { requiresActor: true, partial: before.partial || after.partial })
    if (!before.partial && before.nickname !== after.nickname) emit(after.guild, 'members', 'memberNicknameChanged', [field('user', label(after.user || after)), field('before', before.nickname), field('after', after.nickname)])
    if (!hasAudit(after.guild) && before.communicationDisabledUntilTimestamp !== after.communicationDisabledUntilTimestamp) emit(after.guild, 'moderation', 'timeoutChanged', [field('user', label(after.user || after))],
      { requiresActor: true, subject: userSnapshot(after.user, after.id), timeout: { before: timeoutValue(before.communicationDisabledUntilTimestamp), after: timeoutValue(after.communicationDisabledUntilTimestamp) }, partial: before.partial || after.partial })
  })
  for (const [event, kind] of [['guildBanAdd', 'banned'], ['guildBanRemove', 'unbanned']]) on(event, ban => {
    if (!hasAudit(ban.guild)) emit(ban.guild, 'moderation', kind, [field('user', label(ban.user)), field('reason', ban.reason)], { requiresActor: true, subject: userSnapshot(ban.user), partial: !ban.user })
  })
  on('guildAuditLogEntryCreate', (entry, guild) => {
    if (!validId(entry.id) || !validId(entry.targetId)) return
    const kind = { [AuditLogEvent.MemberKick]: 'kicked', [AuditLogEvent.MemberBanAdd]: 'banned', [AuditLogEvent.MemberBanRemove]: 'unbanned' }[entry.action]
    const change = entry.action === AuditLogEvent.MemberUpdate && entry.changes?.find(item => item.key === 'communication_disabled_until')
    if (!kind && !change) return
    const key = guild.id + ':' + entry.id
    if (seenAuditEntries.has(key)) return
    seenAuditEntries.set(key, Date.now())
    for (const [id, time] of seenAuditEntries) { if (seenAuditEntries.size > 2000 || time < Date.now() - 300000) seenAuditEntries.delete(id); else break }
    emit(guild, 'moderation', kind || 'timeoutChanged', [field('user', `<@${entry.targetId}>`), field('reason', entry.reason)],
      { requiresActor: true, actorId: validId(entry.executorId) ? entry.executorId : undefined, subject: userSnapshot(entry.target?.id === entry.targetId ? entry.target : undefined, entry.targetId),
        auditEntryId: entry.id, occurredAt: Number.isFinite(entry.createdTimestamp) ? new Date(entry.createdTimestamp) : undefined, origin: 'audit',
        ...(change ? { timeout: { before: timeoutValue(change.old), after: timeoutValue(change.new) } } : {}) })
  })
  on('messageDelete', message => {
    if (!message.guild || message.author?.id === client.user.id) return
    emit(message.guild, 'messages', 'messageDeleted', [field('user', label(message.author)), field('channel', `<#${message.channelId}>`), field('id', message.id), field('attachments', message.attachments?.size || 0)],
      { ...messageSnapshot(message, true), sourceChannelId: message.channelId, message: true, partial: message.partial || !message.author, content: { current: typeof message.content === 'string' ? message.content.slice(0, 1000) : undefined } })
  })
  on('messageDeleteBulk', messages => {
    const first = messages.first()
    if (!first?.guild) return
    emit(first.guild, 'messages', 'messagesDeleted', [field('channel', `<#${first.channelId}>`), field('count', messages.size)], { sourceChannelId: first.channelId, message: true })
  })
  on('messageUpdate', (before, after) => {
    if (!after.guild || before.author?.bot || after.author?.bot) return
    const changedText = typeof before.content === 'string' && typeof after.content === 'string' && before.content !== after.content
    const attachmentsChanged = before.attachments && after.attachments && [...before.attachments.keys()].join(',') !== [...after.attachments.keys()].join(',')
    const partialEdit = (before.partial || after.partial) && after.editedTimestamp && before.editedTimestamp !== after.editedTimestamp
    if (!changedText && !attachmentsChanged && !partialEdit) return
    emit(after.guild, 'messages', attachmentsChanged && !changedText ? 'attachmentsChanged' : 'messageEdited',
      [field('user', label(after.author)), field('channel', `<#${after.channelId}>`), field('id', after.id), field('attachments', after.attachments?.size || 0)],
      { ...messageSnapshot(after), sourceChannelId: after.channelId, message: true, partial: before.partial || after.partial,
        content: { before: typeof before.content === 'string' ? before.content.slice(0, 1000) : undefined, after: typeof after.content === 'string' ? after.content.slice(0, 1000) : undefined } })
  })
  on('voiceStateUpdate', (before, after) => {
    if (before.channelId === after.channelId) return
    const fields = [field('user', label(after.member?.user || { id: after.id }))]
    if (before.channelId) fields.push(field('from', `<#${before.channelId}>`))
    if (after.channelId) fields.push(field('to', `<#${after.channelId}>`))
    emit(after.guild, 'voice', !before.channelId ? 'voiceJoined' : !after.channelId ? 'voiceLeft' : 'voiceMoved', fields,
      { subject: userSnapshot(after.member?.user, after.id), sourceChannelId: after.channelId || before.channelId, additionalSourceChannelIds: before.channelId && after.channelId ? [before.channelId] : [], partial: !after.member })
  })
  on('guildUpdate', (before, after) => {
    if (before.name !== after.name) emit(after, 'server', 'guildRenamed', [field('before', label(before)), field('after', label(after))], { requiresActor: true })
    if (before.verificationLevel !== after.verificationLevel) emit(after, 'server', 'guildSettingsChanged', [field('before', before.verificationLevel), field('after', after.verificationLevel)], { requiresActor: true })
  })
  on('webhooksUpdate', channel => channelEvent(channel, 'webhooksChanged', [field('channel', label(channel))]))
  for (const [event, kind] of [['inviteCreate', 'inviteCreated'], ['inviteDelete', 'inviteDeleted']]) on(event, invite => {
    const reference = typeof invite.code === 'string' ? createHash('sha256').update(invite.code).digest('hex').slice(0, 12) : '—'
    emit(invite.guild, 'server', kind, [field('channel', invite.channel?.id ? `<#${invite.channel.id}>` : '—'), field('id', reference)], { sourceChannelId: invite.channel?.id, requiresActor: true })
  })
  on('guildDelete', guild => { if (guild?.id && guild.available !== false) { service.forget(guild.id); for (const key of seenAuditEntries.keys()) if (key.startsWith(guild.id + ':')) seenAuditEntries.delete(key) } })
  return () => { for (const [event, listener] of listeners) client.off(event, listener); seenAuditEntries.clear() }
}
module.exports = { attachLogEvents }
