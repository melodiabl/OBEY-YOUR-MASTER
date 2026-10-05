const { test } = require('node:test')
const assert = require('node:assert/strict')
const { compileEdits } = require('../handlers/architect/application')
const { installArchitectRetryGuard, verifyCreation, creationOptions, reconcileCreation } = require('../handlers/architect/creations')
const { REST } = require('discord.js')
const role = { id: 'local:role', name: 'Member', position: 1, permissions: '0', color: 123, hoist: false, mentionable: false, managed: false }
const category = { id: 'local:category', name: 'Community', type: 4, parentId: null, position: 0, topic: '', nsfw: false, bitrate: null, userLimit: null, rateLimitPerUser: 0, overwrites: [] }
const channel = { ...category, id: 'local:chat', name: 'chat', type: 0, parentId: category.id, topic: 'Welcome' }
const create = (kind, after) => ({ kind, operation: 'create', id: after.id, after })
test('creation dependencies run roles then categories then channels; unsupported grants and placement fail closed', () => {
  const operations = compileEdits({ changes: [create('channels', channel), create('channels', category), create('roles', role)] })
  assert.deepEqual(operations.map(op => op.resourceId), [role.id, category.id, channel.id])
  assert.equal(operations[0].action, 'create')
  for (const invalid of [{ ...role, permissions: '8' }, { ...role, position: 2 }]) assert.throws(() => compileEdits({ changes: [create('roles', invalid)] }), /supported/)
  assert.throws(() => compileEdits({ changes: [create('channels', { ...channel, overwrites: [{ id: 'everyone', type: 0, allow: '0', deny: '1024' }] })] }), /supported/)
  const options = creationOptions(operations[2], { [category.id]: '123456789012345678' }, 'reason')
  assert.equal(options.parent, '123456789012345678'); assert.equal(options.position, undefined)
  assert.throws(() => creationOptions(operations[2], {}, 'reason'), /mapping/)
})
test('creation HTTP transport does not retry ambiguous 5xx or network failure but keeps other requests unchanged', async () => {
  for (const network of [false, true]) {
    let calls = 0
    const rest = new REST({ retries: 3, makeRequest: async () => { calls++; if (network) throw Object.assign(new Error('lost'), { code: 'ECONNRESET' }); return new Response('{}', { status: 500 }) } }).setToken('fixture')
    installArchitectRetryGuard(rest); installArchitectRetryGuard(rest)
    await assert.rejects(rest.post('/guilds/123456789012345678/channels', { body: { name: 'test' }, reason: 'OBEY Architect fixture / create-1' }), /uncertain/)
    assert.equal(calls, 1)
    await assert.rejects(rest.get('/guilds/123456789012345678/channels'))
    assert.equal(calls, 5)
    await assert.rejects(rest.post('/guilds/123456789012345678/channels', { body: { name: 'legacy' } }))
    assert.equal(calls, 9)
  }
})
test('creation validation rejects extra resources or external edits and accepts provider position renumbering', () => {
  const before = { channels: [], roles: [{ ...role, id: 'existing', position: 2 }], roleColors: {} }
  const after = { channels: [], roles: [{ ...role, id: '123456789012345678', position: 1 }, { ...before.roles[0], position: 3 }], roleColors: { '123456789012345678': { primaryColor: 123, secondaryColor: null, tertiaryColor: null } } }
  const operation = compileEdits({ changes: [create('roles', role)] })[0]
  assert.equal(verifyCreation(before, after, operation, '123456789012345678', {}), true)
  const external = structuredClone(after); external.roles[1].name = 'external'
  assert.equal(verifyCreation(before, external, operation, '123456789012345678', {}), false)
  const duplicate = structuredClone(after); duplicate.roles.push({ ...role, id: '123456789012345679' })
  assert.equal(verifyCreation(before, duplicate, operation, '123456789012345678', {}), false)
})
test('definitive rate limit rejection keeps the shared SDK bucket retry', async () => {
  let calls = 0
  const rest = new REST({ retries: 3, makeRequest: async () => ++calls === 1
    ? new Response(JSON.stringify({ message: 'Rate limited', retry_after: 0.001, global: false }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '0.001' } })
    : new Response(JSON.stringify({ id: '123456789012345678' }), { status: 201, headers: { 'Content-Type': 'application/json' } }) }).setToken('fixture')
  installArchitectRetryGuard(rest)
  assert.equal((await rest.post('/guilds/123456789012345678/roles', { body: { name: 'test' }, reason: 'OBEY Architect fixture / create-1' })).id, '123456789012345678')
  assert.equal(calls, 2)
})
test('Architect permission PATCH cannot replay an ambiguous response', async () => {
  let calls = 0
  const rest = new REST({ retries: 3, makeRequest: async () => { calls++; return new Response('{}', { status: 500 }) } }).setToken('fixture')
  installArchitectRetryGuard(rest)
  await assert.rejects(rest.patch('/channels/123456789012345678', { body: { permission_overwrites: [] }, reason: 'OBEY Architect fixture / permissions-1' }), /uncertain/)
  assert.equal(calls, 1)
  for (const kind of ['roles', 'channels']) {
    await assert.rejects(rest.patch(`/guilds/123456789012345678/${kind}`, { body: [{ id: '123456789012345679', position: 1 }], reason: `OBEY Architect fixture / reorder-${kind}` }), /uncertain/)
  }
  assert.equal(calls, 3)
})
test('lost creation responses need unique audit evidence from this bot and exact job reason; names alone are insufficient', async () => {
  const operation = compileEdits({ changes: [create('channels', category)] })[0]
  const entries = new Map(), guild = { client: { user: { id: 'bot' } }, fetchAuditLogs: async () => ({ entries }) }
  assert.equal(await reconcileCreation(guild, operation, 'job'), null)
  entries.set('audit', { action: 10, reason: `OBEY Architect job / ${operation.id}`, executorId: 'other', targetId: '123456789012345678' })
  assert.equal(await reconcileCreation(guild, operation, 'job'), null)
  entries.get('audit').executorId = 'bot'
  assert.equal(await reconcileCreation(guild, operation, 'job'), '123456789012345678')
  entries.set('duplicate', { ...entries.get('audit'), targetId: '123456789012345679' })
  assert.equal(await reconcileCreation(guild, operation, 'job'), null)
})
