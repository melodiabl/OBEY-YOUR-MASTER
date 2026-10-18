const { PermissionFlagsBits: F } = require('discord.js')
const { createSetupSettings } = require('./setup-settings')
const { runSetupOperation } = require('./setup-operations')
const { serialize } = require('./setup-publications')
const { requireSetupAccess } = require('./setup-access')
const { field, channel, label } = require('./setup-fields')
const { z } = require('zod')
function counterFields(number) {
  if (!Number.isInteger(number) || number < 1 || number > 25) throw new Error('invalid_setup_definition')
  return {
    channel: channel(`membercount.channel${number}`, 'no', 'Canal que se renombra', 'Channel to rename', { channelTypes: [0, 2, 4, 5, 13], send: false }),
    name: field(`membercount.message${number}`, 'text', 'Miembros: {members}', z.string().min(1).max(100), 'Nombre con variables', 'Name with placeholders', { maxInput: 100, hint: label('{users}, {members}, {bots}, {online}, {offline}, {roles}, {channels}… Los estados dependen de las presencias disponibles.', '{users}, {members}, {bots}, {online}, {offline}, {roles}, {channels}… Status counts depend on available presences.') }),
  }
}
function renderMemberCount(template, guild) {
  const members = [...guild.members.cache.values()], channels = [...guild.channels.cache.values()], humans = members.filter(member => !member.user.bot)
  const count = (list, status) => list.filter(member => (member.presence?.status || 'offline') === status).length
  const values = { user: guild.memberCount, users: guild.memberCount, member: humans.length, members: humans.length, bot: members.length - humans.length, bots: members.length - humans.length,
    online: count(members, 'online'), offline: count(members, 'offline'), idle: count(members, 'idle'), dnd: count(members, 'dnd'), allonline: members.filter(member => member.presence?.status && member.presence.status !== 'offline').length,
    onlinemember: count(humans, 'online'), offlinemember: count(humans, 'offline'), idlemember: count(humans, 'idle'), dndmember: count(humans, 'dnd'), allonlinemember: humans.filter(member => member.presence?.status && member.presence.status !== 'offline').length,
    role: guild.roles.cache.size, roles: guild.roles.cache.size, channel: channels.length, channels: channels.length }
  for (const [key, type] of Object.entries({ text: 0, voice: 2, stage: 13, news: 5, category: 4, parent: 4 })) values[key] = channels.filter(channel => channel.type === type).length
  values.thread = channels.filter(channel => channel.isThread?.()).length
  values.openthread = channels.filter(channel => channel.isThread?.() && !channel.archived).length
  values.archivedthread = channels.filter(channel => channel.isThread?.() && channel.archived).length
  for (const key of ['text', 'voice', 'stage', 'thread', 'openthread', 'archivedthread']) values[key + 's'] = values[key]
  return String(template).replace(/\{([a-z]+)\}/gi, (match, key) => Object.hasOwn(values, key.toLowerCase()) ? String(values[key.toLowerCase()]) : match).slice(0, 100).replace(/[\uD800-\uDBFF]$/, '')
}
function updateMemberCounter(client, context, number, { hydrate = true } = {}) {
  return runSetupOperation(client, () => serialize(client, `${context.guildId}:membercount${number}`, async () => {
    if (context.actorId) await requireSetupAccess(client, context)
    const guild = client.guilds.cache.get(context.guildId), service = createSetupSettings(client.setups, counterFields(number))
    if (!guild || guild.available === false) throw new Error('setup_unavailable')
    const value = await service.read(guild.id)
    if (value.values.channel === 'no') { if (context.actorId) throw new Error('setup_resource'); return }
    if (!counterFields(number).name.schema.safeParse(value.values.name).success) throw new Error('invalid_setup')
    if (hydrate) await guild.members.fetch()
    const [bot, channel] = await Promise.all([guild.members.fetchMe({ force: Boolean(context.actorId) }), guild.channels.fetch(value.values.channel)])
    if (!channel || channel.guildId !== guild.id || !channel.permissionsFor(bot)?.has([F.ViewChannel, F.ManageChannels])) throw new Error('setup_resource')
    if (context.actorId) await requireSetupAccess(client, context)
    if (client._shuttingDown || context.isActive && !context.isActive()) return
    const latest = await service.read(guild.id)
    if (latest.values.channel !== value.values.channel || latest.values.name !== value.values.name) throw new Error('setup_conflict')
    const name = renderMemberCount(value.values.name, guild)
    if (channel.name !== name) await channel.setName(name)
  }))
}
module.exports = { counterFields, renderMemberCount, updateMemberCounter }
