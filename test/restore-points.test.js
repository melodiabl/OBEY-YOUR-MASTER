const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createRestorePointService } = require('../handlers/architect/restore-points')
const { structureRevision } = require('../handlers/architect/snapshot')
function fixture() {
  const records = new Map()
  const repository = {
    async findByJob(guildId, actorId, jobId) { return [...records.values()].find(r => r.guildId === guildId && r.actorId === actorId && r.jobId === jobId) || null },
    async ensure(input) { const old = await this.findByJob(input.guildId, input.actorId, input.jobId); if (old) return old; records.set(input._id, structuredClone(input)); return input },
    async list(guildId, actorId) { return [...records.values()].filter(r => r.guildId === guildId && r.actorId === actorId) },
    async get(id, guildId, actorId) { const r = records.get(id); return r?.guildId === guildId && r.actorId === actorId ? structuredClone(r) : null },
  }
  const snapshot = { schemaVersion: 1, guildId: 'g', name: 'Fixture', capturedAt: new Date().toISOString(),
    channels: [], roles: [], token: 'must-not-persist' }
  snapshot.revision = structureRevision(snapshot.channels, snapshot.roles)
  let reads = 0
  const service = createRestorePointService({ repository, snapshot: async () => { reads++; return snapshot } })
  return { records, snapshot, service, reads: () => reads }
}
test('restore points are immutable, private, scoped and explicit about structural completeness', async () => {
  const f = fixture(), first = await f.service.create({ id: 'g' }, 'u', 'job-1')
  f.snapshot.name = 'later'
  const retried = await f.service.create({ id: 'g' }, 'u', 'job-1')
  assert.equal(first.id, retried.id); assert.equal(f.reads(), 1)
  assert.equal(first.completeness, 'structure_only'); assert.match(first.warnings.join(' '), /mensajes/)
  assert.equal(JSON.stringify([...f.records.values()]).includes('must-not-persist'), false)
  assert.equal(await f.service.get(first.id, 'g', 'other'), null)
  assert.equal(await f.service.get(first.id, 'other', 'u'), null)
  assert.equal((await f.service.get(first.id, 'g', 'u')).snapshot.name, 'Fixture')
  assert.equal((await f.service.list('g', 'u'))[0].snapshot, undefined)
})
test('lost guild lease and invalid snapshot prevent a restore point from being persisted', async () => {
  const f = fixture()
  await assert.rejects(f.service.create({ id: 'g' }, 'u', 'job-1', { assertOwned: async () => { throw new Error('lease lost') } }), /lease lost/)
  assert.equal(f.records.size, 0)
  f.snapshot.revision = 'incorrect'
  await assert.rejects(f.service.create({ id: 'g' }, 'u', 'job-1'), /revision/)
  assert.equal(f.records.size, 0)
  await assert.rejects(f.service.get({ $ne: '' }, 'g', 'u'), /Invalid/)
})
test('a corrupt stored snapshot is rejected when inspected', async () => {
  const f = fixture(), point = await f.service.create({ id: 'g' }, 'u', 'job-1')
  f.records.get(point.id).snapshot.name = 'tampered'
  await assert.rejects(f.service.get(point.id, 'g', 'u'), /integrity/)
})
