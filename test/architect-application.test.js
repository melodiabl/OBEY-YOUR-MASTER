const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createApplicationService, compileEdits } = require('../handlers/architect/application')
const { structureRevision } = require('../handlers/architect/snapshot')
function fixture() {
  const records = new Map()
  const snapshot = { revision: 'source' }, blueprint = { baseRevision: 'source' }
  const diff = { revision: 'approved', changes: [{ kind: 'channels', operation: 'update', id: 'chat', field: 'name', before: 'old', after: 'new' }] }
  const repository = {
    async create(record) { records.set(record._id, structuredClone(record)); return record },
    async get(id, guildId, actorId) { const r = records.get(id); return r?.guildId === guildId && r.actorId === actorId ? structuredClone(r) : null },
    async confirm(id) { const record = records.get(id); record.confirmed = true; return structuredClone(record) },
  }
  let enabled = true, current = 'source', calls = 0
  const jobs = { available: () => true, async submit(input) { calls++; return { id: 'job', status: 'queued', type: input.type } } }
  const service = createApplicationService({ repository, jobs: () => jobs, enabled: () => enabled,
    preview: async () => ({ snapshot, blueprint, diff, preflight: { status: 'passed' } }), snapshot: async () => ({ revision: current }) })
  return { records, service, disable() { enabled = false }, drift() { current = 'changed' }, calls: () => calls }
}
test('application confirmation is private and bound to the exact reviewed revision', async () => {
  const f = fixture(), plan = await f.service.prepare({ id: 'g' }, 'u', {})
  assert.equal(f.calls(), 0)
  assert.equal(await f.service.payload(plan.id, 'g', 'other'), null)
  await assert.rejects(f.service.confirm({ id: 'g' }, 'u', { ...plan, revision: 'different' }), error => error.code === 'application_conflict')
  await assert.rejects(f.service.confirm({ id: 'g' }, 'other', plan), error => error.code === 'application_not_found')
  assert.equal(f.calls(), 0)
  const job = await f.service.confirm({ id: 'g' }, 'u', plan)
  assert.equal(job.type, 'architect.apply'); assert.equal(f.calls(), 1)
  assert.equal((await f.service.payload(plan.id, 'g', 'u')).revision, 'approved')
})
test('a stale, expired, disabled or unsupported application cannot be confirmed', async () => {
  const f = fixture(), plan = await f.service.prepare({ id: 'g' }, 'u', {})
  f.drift(); await assert.rejects(f.service.confirm({ id: 'g' }, 'u', plan), error => error.code === 'revision_conflict')
  const expired = fixture(), exp = await expired.service.prepare({ id: 'g' }, 'u', {})
  expired.records.get(exp.id).expiresAt = new Date(0)
  await assert.rejects(expired.service.confirm({ id: 'g' }, 'u', exp), error => error.code === 'application_expired')
  const disabled = fixture(); disabled.disable()
  await assert.rejects(disabled.service.prepare({ id: 'g' }, 'u', {}), error => error.code === 'apply_unavailable')
  assert.throws(() => compileEdits({ changes: [{ kind: 'channels', operation: 'create', id: 'local:new' }] }), /supported/)
  assert.throws(() => compileEdits({ changes: [{ kind: 'roles', operation: 'update', id: 'role', field: 'permissions', after: '8' }] }), /supported/)
})
test('an expired or unconfirmed plan cannot supply a job payload', async () => {
  const f = fixture(), plan = await f.service.prepare({ id: 'g' }, 'u', {})
  assert.equal(await f.service.payload(plan.id, 'g', 'u'), null)
  assert.throws(() => compileEdits({ changes: [] }), /empty/)
  assert.equal(structureRevision([], []).length, 64)
})
