const { test } = require('node:test')
const assert = require('node:assert/strict')
const { PermissionsBitField } = require('discord.js')
const { compileEdits } = require('../handlers/architect/application')
const { checkChannelMoves } = require('../handlers/architect/moves')
function fixture() {
  const chat = { id: 'chat', type: 0, parentId: 'old', position: 1, overwrites: [] }
  const old = { id: 'old', type: 4, parentId: null, overwrites: [] }, destination = { ...old, id: 'destination' }
  const observed = { channels: [old, destination, chat] }, blueprint = structuredClone(observed)
  blueprint.channels[2].parentId = destination.id
  const diff = { changes: [{ operation: 'move', kind: 'channels', id: 'chat', resourceType: 0, before: { parentId: 'old', position: 1 }, after: { parentId: destination.id, position: 1 } }] }
  const member = { permissions: new PermissionsBitField(8n) }
  const guild = { channels: { cache: new Map(observed.channels.map(channel => [channel.id, { permissionsFor: () => new PermissionsBitField(8n) }])) } }
  return { observed, blueprint, diff, guild, members: { actor: member, bot: member } }
}
test('parent moves follow channel creation and precede permissions; combined parent/order and advanced moves are rejected', () => {
  const f = fixture(), change = f.diff.changes[0]
  const operations = compileEdits({ changes: [{ kind: 'roles', id: 'staff', operation: 'update', field: 'permissions', after: '0' }, change] })
  assert.deepEqual(operations.map(operation => operation.action), ['move', 'permissions'])
  assert.deepEqual(operations[0].fields, { parentId: 'destination' })
  for (const unsupported of [{ ...change, after: { ...change.after, position: 2 } }, { ...change, kind: 'roles' }, { ...change, resourceType: 5 }]) assert.throws(() => compileEdits({ changes: [unsupported] }), /supported/)
  const oversized = Array.from({ length: 500 }, (_, index) => ({ ...change, id: `chat-${index}` }))
  oversized.push(...Array.from({ length: 500 }, (_, index) => ({ operation: 'overwrites', kind: 'channels', id: `chat-${index}`, resourceType: 0, after: [] })), { operation: 'update', kind: 'roles', id: 'staff', field: 'permissions', after: '0' })
  assert.throws(() => compileEdits({ changes: oversized }), /supported/)
})
test('moves preserve privacy, require access to the destination and allow removal of category without syncing permissions', () => {
  const f = fixture(), check = () => checkChannelMoves({ ...f, operations: compileEdits(f.diff) })
  assert.equal(check().every(item => item.status === 'passed'), true)
  f.observed.channels[1].overwrites = [{ id: 'g', type: 0, allow: '0', deny: '1024' }]
  assert.equal(check().find(item => item.code === 'move_privacy_chat').status, 'failed')
  f.observed.channels[2].overwrites = structuredClone(f.observed.channels[1].overwrites)
  assert.equal(check().find(item => item.code === 'move_privacy_chat').status, 'passed')
  f.guild.channels.cache.get('destination').permissionsFor = () => new PermissionsBitField(0n)
  assert.equal(check().find(item => item.code === 'bot_destination_chat').status, 'failed')
  f.diff.changes[0].after.parentId = null; f.blueprint.channels[2].parentId = null
  assert.equal(check().every(item => item.status === 'passed'), true)
  f.members.actor.permissions = new PermissionsBitField(['ViewChannel', 'ManageChannels', 'ManageGuild'])
  f.guild.channels.cache.get('chat').permissionsFor = () => new PermissionsBitField(['ViewChannel', 'ManageChannels'])
  f.members.actor.isCommunicationDisabled = () => true
  assert.equal(check().find(item => item.code === 'actor_current_chat').status, 'failed')
  f.members.actor.isCommunicationDisabled = () => false
  f.observed.channels[2].type = 2; f.diff.changes[0].resourceType = 2
  assert.equal(check().find(item => item.code === 'actor_current_chat').status, 'failed')
})
test('completed moves can coexist with separately confirmed later channel permissions', () => {
  const f = fixture(); f.observed.channels[2].parentId = 'destination'
  f.observed.channels[2].overwrites = [{ id: 'staff', type: 0, allow: '2048', deny: '0' }]
  assert.equal(checkChannelMoves({ ...f, operations: compileEdits(f.diff) }).every(item => item.status === 'passed'), true)
})
test('category capacity is checked at each intermediate creation/move, not just in the final blueprint', () => {
  const f = fixture()
  for (let index = 0; index < 50; index++) {
    f.observed.channels.push({ id: `child-${index}`, type: 0, parentId: 'destination', overwrites: [] })
    f.guild.channels.cache.set(`child-${index}`, { permissionsFor: () => new PermissionsBitField(8n) })
  }
  const reports = checkChannelMoves({ ...f, operations: compileEdits(f.diff) })
  assert.equal(reports.find(item => item.code.startsWith('move_capacity_')).status, 'failed')
  const leaving = { id: 'out', action: 'move', kind: 'channels', resourceId: 'child-0', fields: { parentId: null } }
  const entering = compileEdits(f.diff)[0]
  assert.equal(checkChannelMoves({ ...f, operations: [leaving, entering] }).every(item => item.status === 'passed'), true)
  const creation = { id: 'create', action: 'create', kind: 'channels', resourceId: 'local:new', fields: { id: 'local:new', type: 0, parentId: 'destination', overwrites: [] } }
  assert.equal(checkChannelMoves({ ...f, operations: [creation, leaving] }).find(item => item.code === 'move_capacity_create').status, 'failed')
})
test('movement preflight fails closed for missing state and blocks destinations with incompatible privacy', async () => {
  const f = fixture(), { preflight } = require('../handlers/architect/preflight')
  f.blueprint.roles = []; f.guild.client = { rest: { options: { makeRequest: async () => { throw new Error('Unexpected network') } } } }
  f.guild.members = { fetch: async options => { assert.equal(options.force, true); return f.members.actor }, fetchMe: async options => { assert.equal(options.force, true); return f.members.bot } }
  const check = observed => preflight(f.guild, f.blueprint, f.diff, 'actor', { executionAvailable: true, observed })
  assert.equal((await check(f.observed)).status, 'passed')
  assert.equal((await check(undefined)).status, 'incomplete')
  f.observed.channels[1].overwrites = [{ id: 'g', type: 0, allow: '0', deny: '1024' }]
  assert.equal((await check(f.observed)).status, 'blocked')
})
