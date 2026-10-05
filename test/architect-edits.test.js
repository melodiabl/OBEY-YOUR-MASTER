const { test } = require('node:test')
const assert = require('node:assert/strict')
const { structureRevision } = require('../handlers/architect/snapshot')
const { validateBlueprint } = require('../handlers/architect/blueprint')
const { diffBlueprint } = require('../handlers/architect/diff')
const { compileEdits } = require('../handlers/architect/application')
const { createEditExecutor } = require('../workers/architect-edits')
function fixture() {
  const source = { schemaVersion: 1, guildId: 'g', name: 'Fixture', capturedAt: new Date().toISOString(), channels: [{
    id: 'chat', name: 'old', type: 0, topic: '', position: 0, parentId: null, overwrites: [], nsfw: false, bitrate: null, userLimit: null, rateLimitPerUser: 0,
  }], roles: [] }
  source.revision = structureRevision(source.channels, source.roles)
  const input = { schemaVersion: 1, baseRevision: source.revision, channels: structuredClone(source.channels), roles: [] }
  input.channels[0].name = 'new'
  const blueprint = validateBlueprint(input, source), diff = diffBlueprint(source, blueprint)
  const record = { _id: 'job', token: 'worker', applicationId: 'plan', actorId: 'u', guildId: 'g', type: 'architect.apply',
    payload: { schemaVersion: 1, snapshot: source, blueprint, operations: compileEdits(diff), revision: diff.revision, expiresAt: new Date(Date.now() + 60000) },
    executionRevision: source.revision, steps: [{ id: 'restore_point', status: 'pending' }, { id: 'edit-1', status: 'pending' }], progress: { completed: 0, total: 2 } }
  let current = structuredClone(source), edits = 0, responseLost = false, permitted = true
  const guards = new Map(), points = []
  const repository = {
    async getById() { return structuredClone(record) },
    async startEdit(id, token, index) { if (token !== record.token || record.executionAborted || record.steps[index].status !== 'pending') return false; record.steps[index].status = 'executing'; return true },
    async completeEdit(id, token, index, revision, pointId) { if (token !== record.token) return false; record.steps[index].status = 'completed'; record.executionRevision = revision; record.progress.completed++; if (pointId) record.restorePointId = pointId; return true },
    async abortEdits(id, token) { if (token !== record.token || record.progress.completed > 1 || record.steps.some(step => step.status === 'executing')) return false; record.executionAborted = true; return true },
  }
  const guildOperations = { async claim(guild, job) { if (guards.has(guild) && guards.get(guild) !== job) return false; guards.set(guild, job); return true }, async release(guild, job) { if (guards.get(guild) === job) guards.delete(guild) } }
  const guild = { id: 'g', channels: { async edit(id, patch) { edits++; current.channels[0].name = patch.name; current.revision = structureRevision(current.channels, current.roles); if (responseLost) throw new Error('fixture lost response') } } }
  const execute = createEditExecutor({ repository, guildOperations, enabled: () => true,
    snapshot: async () => structuredClone(current), check: async () => ({ status: permitted ? 'passed' : 'blocked' }),
    restorePoints: { async create() { points.push(structuredClone(current)); return { id: 'point', revision: current.revision } } } })
  const lease = { async assertOwned() {} }
  return { record, guards, points, execute: () => execute(guild, structuredClone(record), lease), edits: () => edits,
    loseResponse() { responseLost = true }, deny() { permitted = false }, drift() { current.channels[0].topic = 'manual'; current.revision = structureRevision(current.channels, current.roles) } }
}
test('confirmed edits capture a prior point, checkpoint real progress and skip completed effects on recovery', async () => {
  const f = fixture(), result = await f.execute()
  assert.equal(f.points[0].channels[0].name, 'old'); assert.equal(result.restorePointId, 'point')
  assert.equal(f.edits(), 1); assert.equal(f.record.progress.completed, 2); assert.equal(f.guards.size, 0)
  await f.execute(); assert.equal(f.edits(), 1)
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
