const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createJobsService } = require('../handlers/jobs/service')
const { createJobProcessor } = require('../workers')

function fixture() {
  const records = new Map(), delivered = []
  const copy = value => value && structuredClone(value)
  const repository = {
    async ensure(input) {
      const existing = [...records.values()].find(job => job.guildId === input.guildId && job.actorId === input.actorId && job.idempotencyKey === input.idempotencyKey)
      if (existing) return copy(existing)
      const job = { ...input, status: 'queued', dispatchPending: true, attempts: 0, cancelRequested: false, progress: { completed: 0, total: 1 }, steps: [{ id: 'snapshot', status: 'pending' }] }
      records.set(job._id, job); return copy(job)
    },
    async getById(id) { return copy(records.get(id)) },
    async get(id, guildId, actorId) { const job = records.get(id); return job?.guildId === guildId && job?.actorId === actorId ? copy(job) : null },
    async list(guildId, actorId) { return [...records.values()].filter(job => job.guildId === guildId && job.actorId === actorId).map(copy) },
    async pending() { return [...records.values()].filter(job => job.status === 'queued').map(copy) },
    async markDispatched(id) { records.get(id).dispatchPending = false },
    async finalizeCancellation(id) { const job = records.get(id); if (job?.cancelRequested && ['queued', 'running'].includes(job.status)) job.status = 'cancelled'; return copy(job) },
    async begin(id, token) { const job = records.get(id); if (!job || job.cancelRequested || !['queued', 'running'].includes(job.status)) return null; Object.assign(job, { status: 'running', token, attempts: job.attempts + 1 }); return copy(job) },
    async checkpoint(id, token, result) { const job = records.get(id); if (job?.token !== token || job.status !== 'running' || job.cancelRequested) return false; Object.assign(job, { result: copy(result), progress: { completed: 1, total: 1 }, steps: [{ id: 'snapshot', status: 'completed' }] }); return true },
    async finish(id, token, status, error) { const job = records.get(id); if (job?.token !== token || job.status !== 'running') return null; Object.assign(job, { status: job.cancelRequested ? 'cancelled' : status, error, dispatchPending: false }); return copy(job) },
    async cancel(id, guildId, actorId) { const job = await this.get(id, guildId, actorId); if (!job) return null; const stored = records.get(id); if (['queued', 'running'].includes(stored.status)) { stored.cancelRequested = true; if (stored.status === 'queued') stored.status = 'cancelled' }; return copy(stored) },
  }
  let queueAvailable = true, dispatchFails = false
  const transport = { available: () => queueAvailable, async add(job) { if (dispatchFails) throw new Error('private Redis address'); delivered.push(job._id) } }
  const service = createJobsService({ repository, transport })
  return { repository, records, delivered, service, unavailable() { queueAvailable = false }, failDispatch() { dispatchFails = true }, restore() { dispatchFails = false } }
}
const input = () => ({ guildId: 'g', actorId: 'u', type: 'architect.snapshot', idempotencyKey: 'same-request' })

test('job submission is durable, idempotent, private and contains measured steps', async () => {
  const f = fixture(), first = await f.service.submit(input()), again = await f.service.submit(input())
  assert.equal(first.id, again.id); assert.equal(f.records.size, 1)
  assert.equal(first.status, 'queued'); assert.deepEqual(first.progress, { completed: 0, total: 1 })
  assert.equal(await f.service.get(first.id, 'g', 'other'), null)
  assert.equal(first.token, undefined); assert.equal(first.idempotencyKey, undefined)
})
test('a failed Redis dispatch preserves the request for a later dispatcher', async () => {
  const f = fixture(); f.failDispatch()
  const job = await f.service.submit(input())
  assert.equal(job.status, 'queued'); assert.equal(f.records.get(job.id).dispatchPending, true)
  assert.deepEqual(f.delivered, [])
  f.restore(); await f.service.repair(); assert.deepEqual(f.delivered, [job.id])
  assert.equal(f.records.get(job.id).dispatchPending, false)
})
test('job input is bounded and unsupported or unavailable jobs fail before persistence', async () => {
  const f = fixture()
  await assert.rejects(f.service.submit({ ...input(), type: 'architect.apply' }), /Unsupported/)
  await assert.rejects(f.service.submit({ ...input(), actorId: { $ne: '' } }), /Invalid/)
  await assert.rejects(f.service.submit({ ...input(), payload: { token: 'secret' } }), /Unknown/)
  f.unavailable(); await assert.rejects(f.service.submit(input()), /unavailable/)
  assert.equal(f.records.size, 0)
})
test('worker persists the result and checkpoint and duplicate delivery does not repeat a read', async () => {
  const f = fixture(), job = await f.service.submit(input()); let reads = 0
  const run = createJobProcessor({ repository: f.repository, handlers: { 'architect.snapshot': async () => { reads++; return { revision: 'r', channels: [] } } } })
  await run({ data: { recordId: job.id }, attemptsMade: 0, opts: { attempts: 3 } })
  const result = await f.service.get(job.id, 'g', 'u')
  assert.equal(result.status, 'completed'); assert.equal(result.progress.completed, 1)
  assert.equal(result.result.revision, 'r')
  await run({ data: { recordId: job.id }, attemptsMade: 1, opts: { attempts: 3 } }); assert.equal(reads, 1)
})
test('a checkpoint survives worker restart and transient failures retain a bounded retry', async () => {
  const f = fixture(), job = await f.service.submit(input())
  const failed = createJobProcessor({ repository: f.repository, handlers: { 'architect.snapshot': async () => { throw new Error('private Discord error') } } })
  await assert.rejects(failed({ data: { recordId: job.id }, attemptsMade: 0, opts: { attempts: 3 } }))
  assert.equal(f.records.get(job.id).status, 'queued')
  assert.equal(JSON.stringify(await f.service.get(job.id, 'g', 'u')).includes('private'), false)
  const stored = f.records.get(job.id)
  Object.assign(stored, { status: 'running', result: { revision: 'checkpoint' }, steps: [{ id: 'snapshot', status: 'completed' }], progress: { completed: 1, total: 1 } })
  const resumed = createJobProcessor({ repository: f.repository, handlers: { 'architect.snapshot': assert.fail } })
  await resumed({ data: { recordId: job.id }, attemptsMade: 1, opts: { attempts: 3 } })
  assert.equal(f.records.get(job.id).status, 'completed'); assert.equal(f.records.get(job.id).result.revision, 'checkpoint')
})
test('cancellation prevents queued work and prevents a running read from publishing a result', async () => {
  const f = fixture(), queued = await f.service.submit(input())
  await f.service.cancel(queued.id, 'g', 'u')
  const never = createJobProcessor({ repository: f.repository, handlers: { 'architect.snapshot': assert.fail } })
  await never({ data: { recordId: queued.id }, opts: { attempts: 3 } })
  const running = await f.service.submit({ ...input(), idempotencyKey: 'second' })
  const run = createJobProcessor({ repository: f.repository, handlers: { 'architect.snapshot': async () => { await f.service.cancel(running.id, 'g', 'u'); return { revision: 'discarded' } } } })
  await run({ data: { recordId: running.id }, opts: { attempts: 3 } })
  const result = await f.service.get(running.id, 'g', 'u')
  assert.equal(result.status, 'cancelled'); assert.equal(result.result, null)
})
test('final retry failure persists a failed state and revocation blocks checkpoint recovery', async () => {
  const f = fixture(), job = await f.service.submit(input())
  const run = createJobProcessor({ repository: f.repository, handlers: { 'architect.snapshot': async () => { throw new Error('private endpoint') } } })
  await assert.rejects(run({ data: { recordId: job.id }, attemptsMade: 2, opts: { attempts: 3 } }))
  assert.equal((await f.service.get(job.id, 'g', 'u')).status, 'failed')
  const restored = await f.service.submit({ ...input(), idempotencyKey: 'checkpoint' })
  Object.assign(f.records.get(restored.id), { status: 'running', steps: [{ id: 'snapshot', status: 'completed' }], result: { revision: 'old' } })
  const { JobError } = require('../handlers/jobs/service')
  const revoked = createJobProcessor({ repository: f.repository, handlers: { 'architect.snapshot': assert.fail }, authorize: async () => { throw new JobError('Permission denied', 'permission_denied') } })
  await assert.rejects(revoked({ data: { recordId: restored.id }, opts: { attempts: 3 } }))
  assert.equal((await f.service.get(restored.id, 'g', 'u')).status, 'failed')
  assert.equal((await f.service.get(restored.id, 'g', 'u')).result, null)
})
test('Redis configuration is explicit and repository queries reject injected identities', async () => {
  const { connectionOptions } = require('../handlers/jobs/runtime')
  assert.throws(() => connectionOptions(undefined), /Invalid/)
  assert.throws(() => connectionOptions('https://127.0.0.1'), /Invalid/)
  assert.throws(() => connectionOptions('redis://127.0.0.1/0?password=secret'), /Invalid/)
  assert.equal(connectionOptions('rediss://127.0.0.1:6379/15').db, 15)
  const repository = require('../handlers/jobs/repository').createJobRepository({ init: assert.fail })
  await assert.rejects(repository.get({ $ne: '' }, 'g', 'u'), /Invalid/)
  await assert.rejects(repository.cancel('id', 'g', { $ne: '' }), /Invalid/)
})
test('cancellation during authorization prevents the next structure read', async () => {
  const f = fixture(), job = await f.service.submit(input())
  const run = createJobProcessor({ repository: f.repository, handlers: { 'architect.snapshot': assert.fail }, authorize: () => f.service.cancel(job.id, 'g', 'u') })
  await run({ data: { recordId: job.id }, opts: { attempts: 3 } })
  assert.equal((await f.service.get(job.id, 'g', 'u')).status, 'cancelled')
})
test('a recovered delivery settles a cancellation left by an interrupted worker', async () => {
  const f = fixture(), job = await f.service.submit(input())
  Object.assign(f.records.get(job.id), { status: 'running', token: 'old-worker', cancelRequested: true })
  const run = createJobProcessor({ repository: f.repository, handlers: { 'architect.snapshot': assert.fail } })
  await run({ data: { recordId: job.id }, opts: { attempts: 3 } })
  assert.equal((await f.service.get(job.id, 'g', 'u')).status, 'cancelled')
})
test('guild contention stays queued without consuming the last failure retry', async () => {
  const f = fixture(), job = await f.service.submit(input())
  const run = createJobProcessor({ repository: f.repository, handlers: { 'architect.snapshot': () => { throw new (require('../handlers/jobs/guild-lock').GuildLockError)('guild_locked') } } })
  await assert.rejects(run({ data: { recordId: job.id }, attemptsMade: 2, opts: { attempts: 3 } }), error => error.code === 'guild_locked')
  assert.equal((await f.service.get(job.id, 'g', 'u')).status, 'queued')
})
