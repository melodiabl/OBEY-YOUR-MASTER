const { test } = require('node:test')
const assert = require('node:assert/strict')
const { structureRevision } = require('../handlers/architect/snapshot')
const { validateBlueprint } = require('../handlers/architect/blueprint')
const { diffBlueprint } = require('../handlers/architect/diff')
const { compileEdits } = require('../handlers/architect/application')
const { createEditExecutor } = require('../workers/architect-edits')
function fixture({ creations = false, permissions = false, moves = false, reorders = false, cascades = false } = {}) {
  const source = { schemaVersion: 1, guildId: 'g', name: 'Fixture', capturedAt: new Date().toISOString(), channels: [{
    id: 'chat', name: 'old', type: 0, topic: '', position: 0, parentId: null, overwrites: [], nsfw: false, bitrate: null, userLimit: null, rateLimitPerUser: 0,
  }], roles: [] }
  if (moves) source.channels.push({ ...source.channels[0], id: 'destination', name: 'Community', type: 4 })
  if (reorders) {
    source.channels.push({ ...source.channels[0], id: 'second', name: 'second', position: 1 })
    source.roles.push(...[['g', 0, false], ['low', 1, false], ['high', 2, false], ['bot', 3, true]].map(([id, position, managed]) => ({ id, position, managed, name: id, permissions: '0', color: 0, hoist: false, mentionable: false })))
  }
  if (permissions) source.roles.push({ id: 'staff', name: 'Staff', position: 1, permissions: '0', color: 0, hoist: false, mentionable: false, managed: false })
  if (cascades) {
    source.roles.push({ id: 'g', name: '@everyone', position: 0, permissions: '0', color: 0, hoist: false, mentionable: false, managed: false })
    source.channels[0].parentId = 'category'
    source.channels.push({ ...source.channels[0], id: 'category', type: 4, parentId: null },
      { ...source.channels[0], id: 'voice', type: 2, bitrate: 64000, userLimit: 0 },
      { ...source.channels[0], id: 'custom', overwrites: [{ id: 'g', type: 0, allow: '2048', deny: '0' }] })
  }
  source.revision = structureRevision(source.channels, source.roles)
  const input = { schemaVersion: 1, baseRevision: source.revision, channels: structuredClone(source.channels), roles: structuredClone(source.roles) }
  if (cascades) { for (const id of ['category', 'chat', 'voice']) input.channels.find(channel => channel.id === id).overwrites = [{ id: 'g', type: 0, allow: '0', deny: '2048' }] }
  else if (reorders) { input.roles[1].position = 2; input.roles[2].position = 1; input.channels[0].position = 1; input.channels[1].position = 0 }
  else if (moves) input.channels[0].parentId = 'destination'
  else if (permissions) { input.roles[0].permissions = '2048'; input.channels[0].overwrites = [{ id: 'staff', type: 0, allow: '2048', deny: '0' }] }
  else if (!creations) input.channels[0].name = 'new'
  else {
    input.roles.push({ id: 'local:member', name: 'Member', position: 1, permissions: '0', color: 123, hoist: false, mentionable: false, managed: false })
    input.channels.push({ ...source.channels[0], id: 'local:category', name: 'Community', type: 4 },
      { ...source.channels[0], id: 'local:text', name: 'chat', parentId: 'local:category' },
      { ...source.channels[0], id: 'local:voice', name: 'Voice', type: 2, parentId: 'local:category', bitrate: 64000, userLimit: 0 })
  }
  const blueprint = validateBlueprint(input, source), diff = diffBlueprint(source, blueprint)
  const record = { _id: 'job', token: 'worker', applicationId: 'plan', actorId: 'u', guildId: 'g', type: 'architect.apply',
    payload: { schemaVersion: 1, snapshot: source, blueprint, operations: compileEdits(diff), revision: diff.revision, expiresAt: new Date(Date.now() + 60000) },
    executionRevision: source.revision, executionSnapshot: structuredClone(source), executionIdMap: {}, steps: [{ id: 'restore_point', status: 'pending' }, ...compileEdits(diff).map(op => ({ id: op.id, status: 'pending' }))], progress: { completed: 0, total: compileEdits(diff).length + 1 } }
  let current = structuredClone(source), edits = 0, responseLost = false, permitted = true
  const guards = new Map(), points = []
  const repository = {
    async getById() { return structuredClone(record) },
    async startEdit(id, token, index) { if (token !== record.token || record.executionAborted || record.steps[index].status !== 'pending') return false; record.steps[index].status = 'executing'; return true },
    async completeEdit(id, token, index, revision, pointId, execution) { if (token !== record.token || record.cancelRequested) return false; record.steps[index].status = 'completed'; record.executionRevision = revision; record.progress.completed++; if (pointId) record.restorePointId = pointId; if (execution) { record.executionSnapshot = structuredClone(execution.snapshot); record.executionIdMap = structuredClone(execution.idMap) }; return true },
    async abortEdits(id, token) { if (token !== record.token || record.progress.completed > 1 || record.steps.some(step => step.status === 'executing')) return false; record.executionAborted = true; return true },
  }
  const guildOperations = { async claim(guild, job) { if (guards.has(guild) && guards.get(guild) !== job) return false; guards.set(guild, job); return true }, async release(guild, job) { if (guards.get(guild) === job) guards.delete(guild) } }
  const guild = { id: 'g', channels: { async edit(id, patch) {
    edits++; if (patch.name !== undefined) current.channels[0].name = patch.name
    if (Object.hasOwn(patch, 'parent')) { assert.equal(patch.lockPermissions, false); assert.equal(patch.position, undefined); assert.equal(patch.permissionOverwrites, undefined); current.channels[0].parentId = patch.parent }
    if (patch.permissionOverwrites) {
      const target = current.channels.find(channel => channel.id === id)
      const children = target.type === 4 ? current.channels.filter(channel => channel.parentId === id && JSON.stringify(channel.overwrites) === JSON.stringify(target.overwrites)) : []
      for (const item of [target, ...children]) item.overwrites = patch.permissionOverwrites.map(overwrite => ({ ...overwrite, allow: String(overwrite.allow), deny: String(overwrite.deny) }))
    }
    current.revision = structureRevision(current.channels, current.roles, current.roleColors); if (responseLost) throw new Error('fixture lost response')
  } } }
  if (permissions) {
    guild.client = { rest: { options: { makeRequest: async () => { throw new Error('Unexpected network') } } } }
    guild.roles = { async edit(id, patch) { assert.equal(typeof patch.permissions, 'bigint'); edits++; current.roles[0].permissions = String(patch.permissions); current.revision = structureRevision(current.channels, current.roles); if (responseLost) throw new Error('fixture lost permission response') } }
  }
  if (moves || cascades) guild.client = { rest: { options: { makeRequest: async () => { throw new Error('Unexpected network') } } } }
  if (reorders) guild.client = { rest: { options: { makeRequest: async () => { throw new Error('Unexpected network') } }, async patch(route, { body, reason }) {
    edits++; assert.ok(reason.startsWith('OBEY Architect job / reorder-')); assert.ok(body.every(entry => Object.keys(entry).sort().join(',') === 'id,position'))
    const kind = route.endsWith('/roles') ? 'roles' : 'channels'
    for (const entry of body) current[kind].find(resource => resource.id === entry.id).position = entry.position
    current[kind].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
    current.revision = structureRevision(current.channels, current.roles)
    if (responseLost) throw new Error('Lost reorder response')
  } } }
  let createCalls = 0, loseCreate = false, auditVisible = true, revokeOnCreate = false
  const auditEntries = new Map()
  if (creations) {
    guild.client = { user: { id: 'bot' }, rest: { options: { makeRequest: async () => { throw new Error('Unexpected network') } } } }
    guild.fetchAuditLogs = async () => ({ entries: auditVisible ? auditEntries : new Map() })
    for (const kind of ['roles', 'channels']) guild[kind] = { ...guild[kind], async create(options) {
      createCalls++; const id = String(123456789012345678n + BigInt(createCalls))
      const operation = record.payload.operations.find(op => op.action === 'create' && op.kind === kind && op.fields.name === options.name)
      const created = { ...structuredClone(operation.fields), id }
      if (kind === 'channels') created.parentId = options.parent ?? null
      else { for (const role of current.roles) if (role.position > 0) role.position++; current.roleColors ??= {}; current.roleColors[id] = { primaryColor: created.color, secondaryColor: null, tertiaryColor: null } }
      current[kind].push(created); current[kind].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
      current.revision = structureRevision(current.channels, current.roles, current.roleColors)
      auditEntries.set(id, { action: kind === 'roles' ? 30 : 10, reason: options.reason, executorId: 'bot', targetId: id })
      if (revokeOnCreate) permitted = false
      if (loseCreate) { loseCreate = false; throw new Error('Lost create response') }
      return { id }
    } }
  }
  const execute = createEditExecutor({ repository, guildOperations, enabled: () => true,
    snapshot: async () => structuredClone(current), check: async () => ({ status: permitted ? 'passed' : 'blocked' }),
    restorePoints: { async create() { points.push(structuredClone(current)); return { id: 'point', revision: current.revision } } } })
  const lease = { async assertOwned() {} }
  return { record, guards, points, execute: () => execute(guild, structuredClone(record), lease), edits: () => edits,
    createCalls: () => createCalls, loseCreate() { loseCreate = true }, hideAudit() { auditVisible = false }, showAudit() { auditVisible = true },
    revokeOnCreate() { revokeOnCreate = true },
    loseFinalCheckpoint() {
      const operation = record.payload.operations.at(-1), id = record.executionIdMap[operation.resourceId]
      record.executionSnapshot[operation.kind] = record.executionSnapshot[operation.kind].filter(resource => resource.id !== id)
      record.executionRevision = record.executionSnapshot.revision = structureRevision(record.executionSnapshot.channels, record.executionSnapshot.roles, record.executionSnapshot.roleColors)
      delete record.executionIdMap[operation.resourceId]; record.steps.at(-1).status = 'executing'; record.progress.completed--
      record.payload.expiresAt = new Date(0)
    },
    loseResponse() { responseLost = true }, deny() { permitted = false }, drift() { current.channels[0].topic = 'manual'; current.revision = structureRevision(current.channels, current.roles) } }
}
test('confirmed edits capture a prior point, checkpoint real progress and skip completed effects on recovery', async () => {
  const f = fixture(), result = await f.execute()
  assert.equal(f.points[0].channels[0].name, 'old'); assert.equal(result.restorePointId, 'point')
  assert.equal(f.edits(), 1); assert.equal(f.record.progress.completed, 2); assert.equal(f.guards.size, 0)
  await f.execute(); assert.equal(f.edits(), 1)
})
test('category permissions checkpoint all reviewed child effects from one write and preserve custom children', async () => {
  const f = fixture({ cascades: true }), result = await f.execute()
  assert.equal(f.edits(), 1); assert.equal(result.edits, 3); assert.equal(result.cascadedChannels, 2)
  assert.deepEqual(f.record.progress, { completed: 2, total: 2 })
  for (const id of ['category', 'chat', 'voice']) {
    assert.deepEqual(f.points[0].channels.find(channel => channel.id === id).overwrites, [])
    assert.equal(f.record.executionSnapshot.channels.find(channel => channel.id === id).overwrites[0].deny, '2048')
  }
  assert.equal(f.record.executionSnapshot.channels.find(channel => channel.id === 'custom').overwrites[0].allow, '2048')
  await f.execute(); assert.equal(f.edits(), 1); assert.equal(f.guards.size, 0)
})
test('lost category response keeps its whole cascade executing and cannot replay', async () => {
  const f = fixture({ cascades: true }); f.loseResponse()
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review')
  assert.equal(f.record.steps[1].status, 'executing'); assert.equal(f.guards.get('g'), 'job')
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review')
  assert.equal(f.edits(), 1)
})
test('creation persists real IDs before dependent channels and completed recovery never repeats POST', async () => {
  const f = fixture({ creations: true }), result = await f.execute()
  assert.equal(f.createCalls(), 4); assert.equal(result.creates, 4); assert.equal(result.edits, 0)
  assert.equal(result.channelCount, 4); assert.equal(result.roleCount, 1)
  assert.equal(Object.keys(result.idMap).length, 4); assert.equal(f.record.progress.completed, 5)
  assert.equal(f.record.executionSnapshot.channels.find(channel => channel.name === 'chat').parentId, result.idMap['local:category'])
  await f.execute(); assert.equal(f.createCalls(), 4); assert.equal(f.guards.size, 0)
})
test('lost creation response is reconciled from audit plus full structure without a second POST', async () => {
  const f = fixture({ creations: true }); f.loseCreate()
  const result = await f.execute(); assert.equal(result.creates, 4); assert.equal(f.createCalls(), 4)
})
test('interrupted creation waits for proof, retains the guard and resumes from real state without duplicates', async () => {
  const f = fixture({ creations: true }); f.loseCreate(); f.hideAudit()
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review')
  assert.equal(f.createCalls(), 1); assert.equal(f.guards.get('g'), 'job')
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review'); assert.equal(f.createCalls(), 1)
  f.showAudit(); await f.execute(); assert.equal(f.createCalls(), 4); assert.equal(f.guards.size, 0)
})
test('permission loss during creation retains the guard and stops all dependent effects', async () => {
  const f = fixture({ creations: true }); f.revokeOnCreate()
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review')
  assert.equal(f.createCalls(), 1); assert.equal(f.guards.get('g'), 'job'); assert.equal(f.record.steps[1].status, 'executing')
})
test('expired confirmation can recover an already applied final creation without starting more effects', async () => {
  const f = fixture({ creations: true }); await f.execute(); f.loseFinalCheckpoint()
  const result = await f.execute(); assert.equal(result.creates, 4); assert.equal(f.createCalls(), 4)
  assert.equal(f.record.progress.completed, 5); assert.equal(f.guards.size, 0)
})
test('a lost REST response cannot be retried and preserves the durable guild guard', async () => {
  const f = fixture(); f.loseResponse()
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review')
  assert.equal(f.edits(), 1); assert.equal(f.record.steps[1].status, 'executing'); assert.equal(f.guards.get('g'), 'job')
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review')
  assert.equal(f.edits(), 1)
})
test('permissions and revision conflicts stop before effects and permanently abort that job', async () => {
  for (const state of ['deny', 'drift']) {
    const f = fixture(); f[state]()
    await assert.rejects(f.execute(), error => ['application_blocked', 'revision_conflict'].includes(error.code))
    assert.equal(f.edits(), 0); assert.equal(f.guards.size, 0); assert.equal(f.record.executionAborted, true)
    await assert.rejects(f.execute(), error => error.code === 'application_blocked')
  }
})
test('another application cannot bypass a retained guild guard', async () => {
  const f = fixture(); f.guards.set('g', 'unresolved-job')
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review')
  assert.equal(f.edits(), 0); assert.equal(f.guards.get('g'), 'unresolved-job')
})
test('confirmed permission changes preserve the prior point, checkpoint separately and do not repeat on recovery', async () => {
  const f = fixture({ permissions: true }), result = await f.execute()
  assert.equal(result.edits, 2); assert.equal(result.permissionChanges, 2); assert.equal(f.edits(), 2)
  assert.equal(f.points[0].roles[0].permissions, '0'); assert.deepEqual(f.points[0].channels[0].overwrites, [])
  assert.equal(f.record.executionSnapshot.roles[0].permissions, '2048')
  assert.equal(f.record.executionSnapshot.channels[0].overwrites[0].allow, '2048')
  assert.equal(f.record.progress.completed, 3); assert.equal(f.guards.size, 0)
  await f.execute(); assert.equal(f.edits(), 2)
})
test('uncertain permission mutations retain their journal and cannot be replayed', async () => {
  const f = fixture({ permissions: true }); f.loseResponse()
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review')
  assert.equal(f.edits(), 1); assert.equal(f.record.steps[1].status, 'executing')
  assert.equal(f.guards.get('g'), 'job')
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review'); assert.equal(f.edits(), 1)
})
test('confirmed category changes preserve IDs, order and overwrites and skip completed moves on recovery', async () => {
  const f = fixture({ moves: true }), result = await f.execute()
  assert.equal(result.moves, 1); assert.equal(result.edits, 1); assert.equal(f.edits(), 1)
  assert.equal(f.points[0].channels[0].parentId, null)
  const chat = f.record.executionSnapshot.channels.find(channel => channel.id === 'chat')
  assert.equal(chat.parentId, 'destination'); assert.equal(chat.position, 0); assert.deepEqual(chat.overwrites, [])
  assert.equal(f.record.progress.completed, 2); assert.equal(f.guards.size, 0)
  await f.execute(); assert.equal(f.edits(), 1)
})
test('an ambiguous move cannot replay and retains the durable guild guard', async () => {
  const f = fixture({ moves: true }); f.loseResponse()
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review')
  assert.equal(f.edits(), 1); assert.equal(f.record.steps[1].status, 'executing'); assert.equal(f.guards.get('g'), 'job')
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review'); assert.equal(f.edits(), 1)
})
test('role/channel reorder batches checkpoint once per kind and preserve protected resources on recovery', async () => {
  const f = fixture({ reorders: true }), result = await f.execute()
  assert.equal(result.reorders, 4); assert.equal(result.edits, 4); assert.equal(f.edits(), 2)
  assert.equal(f.record.progress.completed, 3)
  assert.deepEqual(f.record.executionSnapshot.roles.map(role => role.id), ['g', 'high', 'low', 'bot'])
  assert.deepEqual(f.record.executionSnapshot.channels.map(channel => channel.id), ['second', 'chat'])
  assert.equal(f.record.executionSnapshot.roles.find(role => role.id === 'bot').position, 3)
  assert.deepEqual(f.points[0].roles.map(role => role.id), ['g', 'low', 'high', 'bot'])
  await f.execute(); assert.equal(f.edits(), 2); assert.equal(f.guards.size, 0)
})
test('uncertain reorder batch does not repeat and blocks the next batch', async () => {
  const f = fixture({ reorders: true }); f.loseResponse()
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review')
  assert.equal(f.edits(), 1); assert.equal(f.record.steps[1].status, 'executing'); assert.equal(f.guards.get('g'), 'job')
  await assert.rejects(f.execute(), error => error.code === 'application_needs_review'); assert.equal(f.edits(), 1)
})
