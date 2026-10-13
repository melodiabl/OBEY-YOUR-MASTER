const test = require('node:test')
const assert = require('node:assert/strict')
const { PermissionsBitField } = require('discord.js')
const { buildCommandCatalog } = require('../handlers/command-registry')
const { availableCommands, createHelpService } = require('../handlers/help')
const run = async () => {}
function fixture() {
  const settings = { prefix: '!', NSFW: false }
  const commands = new Map([
    ['ping', { name: 'ping', category: 'Info', aliases: ['p'], description: 'Ping', run }],
    ['ban', { name: 'ban', category: 'Administration', memberpermissions: ['BanMembers'], run }],
    ['eval', { name: 'eval', category: 'Owner', run }],
    ['play', { name: 'play', category: '🎶 Music', parameters: { type: 'music' }, run }],
    ['adult', { name: 'adult', category: 'NSFW', run }],
  ])
  const client = { commands, aliases: new Map([['p', 'play'], ['latency', 'ping']]), settings: { get: () => settings },
    slashCommands: new Map([['infoping', { name: 'ping', description: 'Slash ping', run }], ['moderationban', { name: 'ban', memberpermissions: ['BanMembers'], run }]]),
    allCommands: [{ name: 'info', options: [{ type: 1, name: 'ping', description: 'Ping real', options: [] }] }, { name: 'moderation', options: [{ type: 1, name: 'ban', description: 'Ban real' }] }],
  }
  const guild = { id: 'g', ownerId: 'owner' }
  const member = { id: 'member', guild, permissions: new PermissionsBitField(0n), roles: { cache: new Map() }, voice: {} }
  const channel = { id: 'chat', guildId: 'g', nsfw: false, permissionsFor: () => new PermissionsBitField(8n) }
  const context = { guild, member, channel, settings, bot: { permissions: new PermissionsBitField(8n) }, musicState: null }
  return { client, context, settings }
}

test('catalog uses actual slash invocations and only effective aliases', () => {
  const { client } = fixture(), catalog = buildCommandCatalog(client)
  const ping = catalog.find(entry => entry.id === 'prefix:ping')
  assert.deepEqual(ping.aliases, ['latency'])
  assert.equal(catalog.find(entry => entry.id === 'slash:info.ping').invocation, '/info ping')
  assert.equal(catalog.find(entry => entry.id === 'prefix:play').category, 'Music')
  assert.ok(!catalog.some(entry => entry.id === 'slash:ping'))
  client.commands.get('ban').memberpermissions = [4n]
  assert.deepEqual(buildCommandCatalog(client).find(entry => entry.id === 'prefix:ban').permissions, ['BanMembers'])
  assert.doesNotThrow(() => JSON.stringify(buildCommandCatalog(client)))
})

test('legacy addmoney metadata joins Settings without a corrupted category', () => {
  const { client } = fixture()
  for (const folder of ['Settings', 'Owner']) {
    const command = require(`../commands/${folder}/addmoney`)
    client.commands.set(command.name, command)
    assert.equal(buildCommandCatalog(client).find(entry => entry.id === 'prefix:addmoney').category, 'Settings')
  }
})

test('available help excludes privileged, disabled and voice-incompatible commands', () => {
  const { client, context } = fixture()
  const entries = availableCommands(client, context)
  assert.deepEqual(entries.map(entry => entry.id).sort(), ['prefix:ping', 'slash:info.ping'])
  context.member.permissions = new PermissionsBitField(8n)
  context.member.voice = { channelId: 'voice', channel: { id: 'voice' } }
  const admin = availableCommands(client, context)
  assert.ok(admin.some(entry => entry.id === 'prefix:ban'))
  assert.ok(admin.some(entry => entry.id === 'slash:moderation.ban'))
  assert.ok(!admin.some(entry => entry.id === 'prefix:eval'))
})

test('legacy roles, bot channels, NSFW and DJ rules remain context-specific', () => {
  const { client, context, settings } = fixture()
  settings.adminroles = ['staff']; context.member.roles.cache.set('staff', {})
  context.member.permissions = new PermissionsBitField(4n)
  assert.ok(availableCommands(client, context).some(entry => entry.id === 'prefix:ban'))
  settings.botchannel = ['other']
  assert.equal(availableCommands(client, context).length, 0)
  settings.botchannel = []; settings.NSFW = true; context.channel.nsfw = true
  assert.ok(availableCommands(client, context).some(entry => entry.name === 'adult'))
  context.member.voice.channelId = 'voice'; settings.djonlycmds = ['play']; settings.djroles = ['dj']
  assert.ok(!availableCommands(client, context).some(entry => entry.name === 'play'))
  context.member.roles.cache.set('dj', {})
  assert.ok(availableCommands(client, context).some(entry => entry.name === 'play'))
})

test('queries use refreshed membership, preserve aliases and reject cross-guild context', async () => {
  const { client, context } = fixture()
  let permitted = true, reads = 0
  context.guild.members = { fetch: async () => { reads++; if (!permitted) throw Error('private provider failure'); return context.member }, fetchMe: async () => context.bot }
  context.guild.channels = { fetch: async () => context.channel }
  client.guilds = { cache: new Map([['g', context.guild]]) }
  const service = createHelpService(client)
  const initial = await service.read({ guildId: 'g', actorId: 'member', channelId: 'chat', query: 'latency' })
  assert.equal(initial.detail.id, 'prefix:ping')
  assert.equal((await service.read({ guildId: 'g', actorId: 'member', channelId: 'chat', query: '/info ping' })).detail.id, 'slash:info.ping')
  assert.equal((await service.read({ guildId: 'g', actorId: 'member', channelId: 'chat', query: 'eval' })).detail, null)
  assert.equal(reads, 3)
  permitted = false
  await assert.rejects(service.read({ guildId: 'g', actorId: 'member', channelId: 'chat' }), error => error.code === 'help_unavailable')
  await assert.rejects(service.read({ guildId: 'other', actorId: 'member' }), error => error.code === 'help_not_found')
  await assert.rejects(service.read({ guildId: 'g', actorId: { $ne: '' } }), error => error.code === 'invalid_help')
})

test('a general server context retains prefix help and the legacy music request channel is respected', () => {
  const { client, context, settings } = fixture()
  const general = availableCommands(client, { ...context, channel: null })
  assert.ok(general.some(entry => entry.id === 'prefix:ping'))
  settings.channel = 'chat'
  const inRequestChannel = availableCommands(client, context)
  assert.ok(!inRequestChannel.some(entry => entry.id === 'prefix:ping'))
  assert.ok(inRequestChannel.some(entry => entry.id === 'slash:info.ping'))
})
