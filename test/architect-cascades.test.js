const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Client, Guild, PermissionsBitField, PermissionFlagsBits: F } = require('discord.js')
const { diffBlueprint } = require('../handlers/architect/diff')
const { compileEdits } = require('../handlers/architect/application')
const { checkPermissionPlan, projectedPermissions } = require('../handlers/architect/permissions')
const { createEditorState } = require('../dashboard/public/js/architect-state')
const { syncedChildren, projectCategoryPermissions } = require('../handlers/architect/cascades')
const overwrite = deny => [{ id: 'g', type: 0, allow: '0', deny: String(deny) }]
function fixture() {
  const channel = { id: 'cat', type: 4, parentId: null, position: 0, overwrites: [] }
  const source = { guildId: 'g', revision: 'r', roles: [{ id: 'g', permissions: String(F.ViewChannel | F.ManageGuild | F.ManageChannels | F.ManageRoles) }], channels: [channel,
    { ...channel, id: 'text', type: 0, parentId: 'cat' }, { ...channel, id: 'voice', type: 2, parentId: 'cat' },
    { ...channel, id: 'custom', type: 0, parentId: 'cat', overwrites: overwrite(F.SendMessages) }] }
  const blueprint = { ...structuredClone(source), protectedIds: [] }
  for (const id of ['cat', 'text', 'voice']) blueprint.channels.find(channel => channel.id === id).overwrites = overwrite(F.SendMessages)
  return { source, blueprint }
}
test('sync detection matches the installed SDK including absent zero everyone overwrites', async () => {
  const client = new Client({ intents: [] }), guild = new Guild(client, { id: 'g', name: 'Fixture', roles: [] })
  client.guilds.cache.set('g', guild)
  try {
    const parent = client.channels._add({ id: 'cat', guild_id: 'g', type: 4, name: 'cat', permission_overwrites: [] })
    for (const overwrites of [[], overwrite(0), [{ id: 'other', type: 0, allow: '0', deny: '0' }], overwrite(F.ViewChannel)]) {
      const child = client.channels._add({ id: 'text', guild_id: 'g', type: 0, name: 'text', parent_id: parent.id, permission_overwrites: overwrites })
      const snapshot = { guildId: 'g', channels: [{ id: 'cat', overwrites: [] }, { id: 'text', parentId: 'cat', overwrites }] }
      assert.equal(syncedChildren(snapshot, snapshot.channels[0]).length === 1, child.permissionsLocked)
    }
  } finally { await client.destroy() }
})
test('category diff includes child effects and compiles one reviewed write preserving custom children', () => {
  const { source, blueprint } = fixture(), diff = diffBlueprint(source, blueprint), operations = compileEdits(diff)
  assert.equal(diff.changes.length, 3); assert.equal(operations.length, 1)
  assert.deepEqual(operations[0].resourceIds, ['cat', 'text', 'voice'])
  const state = structuredClone(source); projectCategoryPermissions(state, operations[0])
  assert.deepEqual(state.channels, blueprint.channels); assert.deepEqual(source.channels[0].overwrites, [])
  projectCategoryPermissions(state, operations[0]) // Custom child now matches, but a completed step is a no-op.
  assert.deepEqual(state.channels, blueprint.channels)
  const incomplete = structuredClone(blueprint); incomplete.channels[1].overwrites = []
  assert.throws(() => compileEdits(diffBlueprint(source, incomplete)), /cascade/i)
  const protectedDraft = structuredClone(blueprint); protectedDraft.protectedIds = ['text']
  assert.throws(() => compileEdits(diffBlueprint(source, protectedDraft)), /cascade/i)
  const advancedSource = structuredClone(source), advancedDraft = structuredClone(blueprint)
  advancedSource.channels[1].type = advancedDraft.channels[1].type = 5
  assert.throws(() => compileEdits(diffBlueprint(advancedSource, advancedDraft)), /cascade/i)
  const moved = structuredClone(diff); moved.changes.push({ kind: 'channels', id: 'custom', operation: 'move', resourceType: 0, before: { position: 0, parentId: 'cat' }, after: { position: 0, parentId: null } })
  assert.throws(() => compileEdits(moved), /cascade/i)
  const drift = structuredClone(source); drift.channels[1].overwrites = overwrite(F.ViewChannel)
  assert.throws(() => projectCategoryPermissions(drift, operations[0]), /cascade/i)
})
test('category access projection checks every synced child and editor cascade is atomic with undo/protection', () => {
  const { source, blueprint } = fixture(), editor = createEditorState(source)
  assert.equal(editor.change(draft => { draft.channels[0].overwrites = overwrite(F.SendMessages) }), true)
  assert.deepEqual(editor.current().channels, blueprint.channels)
  editor.undo(); assert.deepEqual(editor.current().channels, source.channels)
  editor.change(draft => draft.protectedIds.push('voice'))
  assert.equal(editor.change(draft => { draft.channels[0].overwrites = overwrite(F.SendMessages) }), false)
  assert.deepEqual(editor.current().channels, source.channels)
  const member = id => ({ id, roles: { cache: new Map([['g', {}]]) }, permissions: new PermissionsBitField(source.roles[0].permissions) })
  const members = { actor: member('actor'), bot: member('bot') }
  for (const id of ['cat', 'text', 'voice']) blueprint.channels.find(channel => channel.id === id).overwrites = overwrite(F.ViewChannel)
  const checks = checkPermissionPlan({ snapshot: source, operations: compileEdits(diffBlueprint(source, blueprint)), members, ownerId: 'owner' })
  assert.ok(checks.every(check => check.status === 'failed'))
  source.roles[0].permissions = String(BigInt(source.roles[0].permissions) | F.Connect)
  blueprint.roles[0].permissions = source.roles[0].permissions
  for (const id of ['cat', 'text', 'voice']) blueprint.channels.find(channel => channel.id === id).overwrites = overwrite(F.Connect)
  assert.ok(checkPermissionPlan({ snapshot: source, operations: compileEdits(diffBlueprint(source, blueprint)), members, ownerId: 'owner' }).every(check => check.status === 'failed'))
})
test('category preflight requires current and projected access to every reviewed voice child', async () => {
  const { source, blueprint } = fixture(), { preflight } = require('../handlers/architect/preflight')
  source.roles[0].permissions = String(BigInt(source.roles[0].permissions) | F.SendMessages | F.Connect)
  blueprint.roles = structuredClone(source.roles)
  const member = id => ({ id, roles: { cache: new Map([['g', {}]]) }, permissions: new PermissionsBitField(source.roles[0].permissions) })
  const members = { actor: member('actor'), bot: member('bot') }
  const guild = { id: 'g', ownerId: 'owner', client: { rest: { options: { makeRequest: async () => { throw Error('No network') } } } },
    roles: { cache: new Map() }, members: { fetch: async () => members.actor, fetchMe: async () => members.bot },
    channels: { cache: new Map(source.channels.map(channel => [channel.id, { type: channel.type, permissionsFor: member => projectedPermissions(source, member, 'owner', channel) }])) } }
  const report = () => preflight(guild, blueprint, diffBlueprint(source, blueprint), 'actor', { executionAvailable: true, observed: source })
  assert.equal((await report()).status, 'passed')
  guild.channels.cache.get('voice').permissionsFor = () => new PermissionsBitField(BigInt(source.roles[0].permissions) & ~F.Connect)
  assert.equal((await report()).checks.find(check => check.code === 'bot_channel_voice').status, 'failed')
  source.channels[0].overwrites = overwrite(0)
  blueprint.channels = structuredClone(source.channels); blueprint.channels[0].overwrites = []
  assert.equal(diffBlueprint(source, blueprint).changes.length, 1)
  assert.equal((await report()).checks.find(check => check.code === 'bot_channel_voice').status, 'failed')
  for (const id of ['cat', 'text', 'voice']) blueprint.channels.find(channel => channel.id === id).overwrites = overwrite(F.Connect)
  assert.equal((await report()).status, 'blocked')
})
