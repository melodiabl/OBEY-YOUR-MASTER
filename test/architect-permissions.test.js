const { test } = require('node:test')
const assert = require('node:assert/strict')
const { Client, Guild, PermissionFlagsBits: F, PermissionsBitField } = require('discord.js')
const { projectedPermissions, checkPermissionPlan } = require('../handlers/architect/permissions')
const { compileEdits } = require('../handlers/architect/application')
const adminBits = F.ViewChannel | F.SendMessages | F.ManageGuild | F.ManageChannels | F.ManageRoles | F.ViewAuditLog
function fixture() {
  const snapshot = { guildId: 'g', roles: [{ id: 'g', permissions: String(F.ViewChannel) }, { id: 'staff', permissions: '0' }, { id: 'actor_role', permissions: String(adminBits) }, { id: 'bot_role', permissions: String(adminBits) }], channels: [{ id: 'chat', type: 0, parentId: null, overwrites: [] }] }
  const member = (id, role) => ({ id, roles: { cache: new Map([['g', {}], [role, {}]]) }, permissions: new PermissionsBitField(adminBits) })
  return { snapshot, members: { actor: member('actor', 'actor_role'), bot: member('bot', 'bot_role') }, ownerId: 'owner' }
}
test('permission projection follows SDK everyone, aggregate roles, member, administrator and owner precedence', async () => {
  const client = new Client({ intents: [] }), guild = new Guild(client, { id: 'g', owner_id: 'owner', name: 'Fixture', roles: [] })
  client.guilds.cache.set(guild.id, guild)
  const snapshot = { guildId: 'g', roles: [{ id: 'g', permissions: String(F.ViewChannel | F.SendMessages) }, { id: 'r1', permissions: '0' }, { id: 'r2', permissions: '0' }], channels: [] }
  for (const role of snapshot.roles) guild.roles._add({ ...role, name: role.id, position: 1 })
  const member = guild.members._add({ user: { id: 'actor', username: 'Fixture', discriminator: '0' }, roles: ['r1', 'r2'], joined_at: new Date().toISOString() })
  try {
    const overwrites = [{ id: 'g', type: 0, allow: '0', deny: String(F.ViewChannel) }, { id: 'r1', type: 0, allow: '0', deny: String(F.ViewChannel | F.ManageThreads) }, { id: 'r2', type: 0, allow: String(F.ViewChannel | F.ManageThreads), deny: '0' }]
    for (const extra of [[], [{ id: 'actor', type: 1, allow: '0', deny: String(F.ViewChannel) }]]) {
      const channel = { id: 'chat', overwrites: [...overwrites, ...extra] }
      const sdkChannel = client.channels._add({ id: 'chat', guild_id: 'g', type: 0, name: 'chat', permission_overwrites: channel.overwrites })
      assert.equal(projectedPermissions(snapshot, member, 'owner', channel).bitfield, sdkChannel.permissionsFor(member).bitfield)
    }
    snapshot.roles[1].permissions = String(F.Administrator)
    assert.equal(projectedPermissions(snapshot, member, 'owner', { overwrites: [] }).has(F.ManageGuild), true)
    assert.equal(projectedPermissions(snapshot, { id: 'owner' }, 'owner', { overwrites: [] }).has(F.Administrator), true)
  } finally { await client.destroy() }
})
test('permission plans block access loss and unsafe intermediate states even when the final state restores access', () => {
  const f = fixture(), report = operations => checkPermissionPlan({ ...f, operations })
  const revoke = { id: 'revoke', kind: 'roles', action: 'permissions', resourceId: 'bot_role', fields: { permissions: '0' } }
  const restore = { id: 'restore', kind: 'roles', action: 'permissions', resourceId: 'bot_role', fields: { permissions: String(adminBits) } }
  assert.equal(report([revoke, restore]).some(check => check.status === 'failed'), true)
  const deny = { id: 'deny', kind: 'channels', action: 'permissions', resourceId: 'chat', fields: { overwrites: [{ id: 'g', type: 0, allow: '0', deny: String(F.ViewChannel) }] } }
  assert.equal(report([deny]).some(check => check.status === 'failed'), true)
  const allow = { id: 'grant', kind: 'roles', action: 'permissions', resourceId: 'staff', fields: { permissions: String(F.SendMessages) } }
  assert.equal(report([allow]).every(check => check.status === 'passed'), true)
  f.members.bot.roles.cache = undefined
  assert.throws(() => report([allow]), /membership/)
})
test('permission operations follow structure and are limited to existing role grants and text/voice overwrites', () => {
  const operations = compileEdits({ changes: [
    { kind: 'channels', id: 'chat', operation: 'overwrites', resourceType: 0, after: [] },
    { kind: 'roles', id: 'staff', operation: 'update', field: 'permissions', after: String(F.SendMessages) },
    { kind: 'channels', id: 'chat', operation: 'update', field: 'name', after: 'renamed' },
  ] })
  assert.deepEqual(operations.map(operation => operation.action || 'edit'), ['edit', 'permissions', 'permissions'])
  assert.equal(operations[1].kind, 'roles')
  assert.throws(() => compileEdits({ changes: [{ kind: 'channels', id: 'category', operation: 'overwrites', resourceType: 4, after: [] }] }), /supported/)
})
test('permission preflight requires known memberships, actual grants and continued actor/bot access', async () => {
  const f = fixture(), { preflight } = require('../handlers/architect/preflight')
  for (const [index, role] of f.snapshot.roles.entries()) Object.assign(role, { name: role.id, position: index })
  const guild = { id: 'g', ownerId: 'owner', client: { rest: { options: { makeRequest: async () => { throw new Error('Unexpected network') } } } }, roles: { cache: new Map(f.snapshot.roles.map(role => [role.id, role])) },
    members: { fetch: async () => f.members.actor, fetchMe: async () => f.members.bot },
    channels: { cache: new Map([['chat', { permissionsFor: member => projectedPermissions(f.snapshot, member, 'owner', f.snapshot.channels[0]) }]]) } }
  for (const member of Object.values(f.members)) member.roles.highest = { position: 10 }
  const blueprint = structuredClone(f.snapshot), diff = { changes: [{ kind: 'channels', id: 'chat', operation: 'overwrites', resourceType: 0, after: [{ id: 'staff', type: 0, allow: String(F.SendMessages), deny: '0' }] }] }
  blueprint.channels[0].overwrites = diff.changes[0].after
  assert.equal((await preflight(guild, blueprint, diff, 'actor', { executionAvailable: true, observed: f.snapshot })).status, 'passed')
  diff.changes[0].after = [{ id: 'g', type: 0, allow: '0', deny: String(F.ViewChannel) }]; blueprint.channels[0].overwrites = diff.changes[0].after
  assert.equal((await preflight(guild, blueprint, diff, 'actor', { executionAvailable: true, observed: f.snapshot })).status, 'blocked')
  diff.changes[0].after = [{ id: 'staff', type: 0, allow: String(F.Administrator), deny: '0' }]
  assert.equal((await preflight(guild, blueprint, diff, 'actor', { executionAvailable: true, observed: f.snapshot })).checks.find(check => check.code === 'bot_overwrite_grant_chat').status, 'failed')
  diff.changes[0].after = []; f.members.bot.roles.cache = undefined
  assert.equal((await preflight(guild, blueprint, diff, 'actor', { executionAvailable: true, observed: f.snapshot })).status, 'incomplete')
  f.members.bot.roles.cache = new Map([['g', {}], ['bot_role', {}]])
  f.members.bot.permissions = new PermissionsBitField(adminBits & ~F.SendMessages)
  f.snapshot.roles.find(role => role.id === 'bot_role').permissions = String(adminBits & ~F.SendMessages)
  f.snapshot.roles.find(role => role.id === 'staff').permissions = String(F.SendMessages)
  diff.changes[0].before = f.snapshot.channels[0].overwrites = [{ id: 'staff', type: 0, allow: '0', deny: String(F.SendMessages) }]
  assert.equal((await preflight(guild, blueprint, diff, 'actor', { executionAvailable: true, observed: f.snapshot })).checks.find(check => check.code === 'bot_overwrite_grant_chat').status, 'failed')
})
