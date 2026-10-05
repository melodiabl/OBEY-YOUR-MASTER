const { test } = require('node:test')
const assert = require('node:assert/strict')
const { PermissionsBitField } = require('discord.js')
const { compileEdits } = require('../handlers/architect/application')
const { checkReorders, projectReorder, affectedResources } = require('../handlers/architect/reorders')
function fixture() {
  const roles = [{ id: 'g', position: 0, managed: false }, { id: 'low', position: 1, managed: false }, { id: 'high', position: 2, managed: false }, { id: 'bot', position: 3, managed: true }]
  const channels = [{ id: 'a', type: 0, parentId: 'cat', position: 0 }, { id: 'b', type: 0, parentId: 'cat', position: 1 }]
  const observed = { guildId: 'g', roles, channels }, blueprint = { ...structuredClone(observed), protectedIds: [] }
  blueprint.roles[1].position = 2; blueprint.roles[2].position = 1
  blueprint.channels[0].position = 1; blueprint.channels[1].position = 0
  const member = { id: 'actor', permissions: new PermissionsBitField(8n), roles: { highest: { position: 3 } } }
  const guild = { id: 'g', ownerId: 'owner', channels: { cache: new Map(channels.map(channel => [channel.id, { permissionsFor: () => new PermissionsBitField(8n) }])) } }
  const diff = { changes: [...roles.slice(1, 3).map(role => ({ kind: 'roles', id: role.id, operation: 'move', before: { position: role.position }, after: { position: blueprint.roles.find(item => item.id === role.id).position } })),
    ...channels.map(channel => ({ kind: 'channels', id: channel.id, operation: 'move', resourceType: 0, before: { parentId: 'cat', position: channel.position }, after: { parentId: 'cat', position: blueprint.channels.find(item => item.id === channel.id).position } }))] }
  return { observed, blueprint, guild, diff, members: { actor: member, bot: { ...member, id: 'bot-member' } } }
}
test('reorders compile into one bounded batch per kind and reject creation or parent movement in that kind', () => {
  const f = fixture(), operations = compileEdits(f.diff)
  assert.equal(operations.length, 2); assert.deepEqual(operations.map(operation => operation.action), ['reorder', 'reorder'])
  assert.deepEqual(affectedResources(operations[0]), ['high', 'low'])
  const projected = projectReorder(f.observed, operations[0])
  assert.deepEqual(projected.roles.map(role => role.id), ['g', 'high', 'low', 'bot'])
  assert.deepEqual(f.observed.roles.map(role => role.id), ['g', 'low', 'high', 'bot'])
  assert.throws(() => compileEdits({ changes: [...f.diff.changes, { operation: 'move', kind: 'channels', id: 'c', resourceType: 0, before: { parentId: 'old', position: 0 }, after: { parentId: 'new', position: 0 } }] }), /supported/)
})
test('reorders preserve position sets, protected anchors and current/proposed role hierarchy', () => {
  const f = fixture(), operations = compileEdits(f.diff), check = () => checkReorders({ ...f, operations })
  assert.equal(check().every(item => item.status === 'passed'), true)
  f.blueprint.protectedIds = ['high']
  assert.equal(check().some(item => item.status === 'failed'), true)
  f.blueprint.protectedIds = []; f.members.bot.roles.highest.position = 2
  assert.equal(check().some(item => item.code.startsWith('reorder_hierarchy_') && item.status === 'failed'), true)
  f.members.bot.roles.highest.position = 3
  operations[1].fields.positions[0].position = 7
  assert.equal(check().some(item => item.code.startsWith('reorder_positions_') && item.status === 'failed'), true)
})
test('channel order cannot exchange voice/text buckets or evade current access checks', () => {
  const f = fixture(), operations = compileEdits(f.diff)
  f.observed.channels[1].type = 2
  assert.equal(checkReorders({ ...f, operations }).some(item => item.status === 'failed'), true)
  f.observed.channels[1].type = 0; f.guild.channels.cache.get('a').permissionsFor = () => new PermissionsBitField(0n)
  assert.equal(checkReorders({ ...f, operations }).some(item => item.code === 'actor_reorder_a' && item.status === 'failed'), true)
})
test('reorder preflight requires fresh state and blocks a hierarchy crossing before any effect', async () => {
  const f = fixture(), { preflight } = require('../handlers/architect/preflight')
  f.guild.client = { rest: { options: { makeRequest: async () => { throw new Error('Unexpected network') } } } }
  f.guild.members = { fetch: async options => { assert.equal(options.force, true); return f.members.actor }, fetchMe: async options => { assert.equal(options.force, true); return f.members.bot } }
  const check = observed => preflight(f.guild, f.blueprint, f.diff, 'actor', { executionAvailable: true, observed })
  assert.equal((await check(f.observed)).status, 'passed')
  assert.equal((await check(undefined)).status, 'incomplete')
  f.members.bot.roles.highest.position = 2
  assert.equal((await check(f.observed)).status, 'blocked')
})
