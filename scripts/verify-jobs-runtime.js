// Explicit isolated fixtures only. Never load dotenv or the application's DB settings.
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const mongoose = require('mongoose')
const { Queue } = require('bullmq')
const { createJobsRuntime, connectionOptions } = require('../handlers/jobs/runtime')
const { createJobRepository } = require('../handlers/jobs/repository')
const { JobError } = require('../handlers/jobs/service')
const mongoUrl = process.env.OBEY_JOBS_TEST_MONGO_URL, redisUrl = process.env.OBEY_JOBS_TEST_REDIS_URL
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\/obey_jobs_test$/.test(mongoUrl || '') || !/^redis:\/\/127\.0\.0\.1:\d+\/15$/.test(redisUrl || '')) throw new Error('Explicit isolated job fixtures required')
const queueName = `obey-test-${randomUUID()}`, guildId = 'jobs_fixture', actorId = 'actor_fixture'
async function until(check) {
  for (let attempt = 0; attempt < 200; attempt++) { const value = await check(); if (value) return value; await new Promise(resolve => setTimeout(resolve, 50)) }
  throw new Error('Timed out waiting for fixture job')
}
async function main() {
  let runtime, queue, model, restoreModel, release
  let reads = 0, backupReads = 0, permitted = true
  try {
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 3000 })
    model = require('../database/schemas/JobSchema')
    const repository = createJobRepository(model)
    const snapshot = { revision: 'fixture_structure', capturedAt: new Date().toISOString(), channels: [], roles: [] }
    restoreModel = require('../database/schemas/ArchitectRestorePointSchema')
    const restorePoints = require('../handlers/architect/restore-points').createRestorePointService({
      repository: require('../handlers/architect/restore-point-repository').createRestorePointRepository(restoreModel),
      snapshot: async guild => { backupReads++; return { ...snapshot, schemaVersion: 1, guildId: guild.id, name: 'Fixture',
        revision: require('../handlers/architect/snapshot').structureRevision([], []) } },
    })
    let interruptedBackup = false
    const options = { repository, redisUrl, queueName,
      authorize: async () => { if (!permitted) throw new JobError('Permission denied', 'permission_denied') },
      handlers: { 'architect.snapshot': async record => {
        reads++
        if (record.idempotencyKey === 'fail') throw new Error('private provider URL')
        if (['cancel', 'lock_holder'].includes(record.idempotencyKey)) await new Promise(resolve => { release = resolve })
        return snapshot
      }, 'architect.backup': async (record, lease) => {
        const point = await restorePoints.create({ id: record.guildId }, record.actorId, record._id, lease)
        if (record.idempotencyKey === 'backup_interrupted' && !interruptedBackup) { interruptedBackup = true; throw new Error('fixture interrupted after persistence') }
        return point
      } },
    }
    runtime = createJobsRuntime(options); await runtime.start()
    assert.equal(runtime.available(), true)
    queue = new Queue(queueName, { connection: connectionOptions(redisUrl) }); queue.on('error', () => {})
    const submit = key => runtime.submit({ guildId, actorId, type: 'architect.snapshot', idempotencyKey: key })
    const get = id => runtime.get(id, guildId, actorId)
    const completed = id => until(async () => { const record = await get(id); return record.status === 'completed' && record })
    const [first, duplicate] = await Promise.all([submit('same'), submit('same')])
    assert.equal(first.id, duplicate.id)
    const result = await completed(first.id)
    assert.deepEqual(result.progress, { completed: 1, total: 1 }); assert.equal(result.result.revision, snapshot.revision)
    assert.equal(await runtime.get(first.id, 'other_guild', actorId), null)
    assert.equal(await runtime.get(first.id, guildId, 'other_actor'), null)
    const history = await runtime.list(guildId, actorId)
    assert.equal(history[0].result.channelCount, 0)
    assert.equal(history[0].result.channels, undefined)
    assert.equal(reads, 1)
    await submit('same'); assert.equal(reads, 1)
    const cancelled = await submit('cancel'); await until(() => release)
    await runtime.cancel(cancelled.id, guildId, actorId); release()
    await until(async () => (await get(cancelled.id)).status === 'cancelled')
    assert.equal((await get(cancelled.id)).result, null)
    const failing = await submit('fail')
    await until(async () => (await get(failing.id)).status === 'failed')
    assert.equal((await repository.getById(failing.id)).attempts, 3)
    assert.equal(JSON.stringify(await get(failing.id)).includes('private'), false)
    const interrupted = await repository.ensure({ _id: randomUUID(), guildId, actorId, type: 'architect.snapshot', idempotencyKey: 'interrupted', correlationId: randomUUID() })
    const staleToken = randomUUID(), freshToken = randomUUID()
    await repository.begin(interrupted._id, staleToken)
    await repository.begin(interrupted._id, freshToken)
    assert.equal(await repository.checkpoint(interrupted._id, staleToken, snapshot), false)
    assert.equal(await repository.checkpoint(interrupted._id, freshToken, snapshot), true)
    const beforeRecovery = reads
    await queue.add('architect.snapshot', { recordId: interrupted._id }, { jobId: interrupted._id, attempts: 3 })
    await completed(interrupted._id); assert.equal(reads, beforeRecovery)
    await runtime.close()
    const unpublished = await repository.ensure({ _id: randomUUID(), guildId, actorId, type: 'architect.snapshot', idempotencyKey: 'unpublished', correlationId: randomUUID() })
    const lostDelivery = await repository.ensure({ _id: randomUUID(), guildId, actorId, type: 'architect.snapshot', idempotencyKey: 'missing_delivery', correlationId: randomUUID() })
    await repository.begin(lostDelivery._id, randomUUID())
    const interruptedCancel = await repository.ensure({ _id: randomUUID(), guildId, actorId, type: 'architect.snapshot', idempotencyKey: 'interrupted_cancel', correlationId: randomUUID() })
    await repository.begin(interruptedCancel._id, randomUUID())
    await repository.cancel(interruptedCancel._id, guildId, actorId)
    runtime = createJobsRuntime(options); await runtime.start()
    await completed(unpublished._id)
    await completed(lostDelivery._id)
    await until(async () => (await get(interruptedCancel._id)).status === 'cancelled')
    assert.equal(reads, beforeRecovery + 2)
    permitted = false
    const revoked = await submit('revoked')
    await until(async () => (await get(revoked.id)).status === 'failed')
    assert.equal((await get(revoked.id)).error.code, 'permission_denied')
    assert.equal((await repository.getById(revoked.id)).attempts, 1)
    permitted = true; release = null
    const holder = await submit('lock_holder'); await until(() => release)
    const waiting = await runtime.submit({ guildId, actorId, type: 'architect.backup', idempotencyKey: 'backup_waiting' })
    await until(async () => (await queue.getJob(waiting.id))?.getState().then(state => state === 'delayed'))
    assert.equal((await get(waiting.id)).status, 'queued'); assert.equal(backupReads, 0)
    assert.equal((await queue.getJob(waiting.id)).attemptsMade, 0)
    const otherGuild = await runtime.submit({ guildId: 'other_jobs_fixture', actorId, type: 'architect.snapshot', idempotencyKey: 'parallel' })
    await until(async () => (await runtime.get(otherGuild.id, 'other_jobs_fixture', actorId)).status === 'completed')
    release(); release = null; await completed(holder.id)
    const saved = await completed(waiting.id)
    assert.equal(saved.steps[0].id, 'restore_point'); assert.equal(saved.result.completeness, 'structure_only')
    assert.equal(backupReads, 1)
    assert.equal(await restorePoints.get(saved.result.id, guildId, 'other_actor'), null)
    const backup = await runtime.submit({ guildId, actorId, type: 'architect.backup', idempotencyKey: 'backup_interrupted' })
    const restored = await completed(backup.id)
    assert.equal((await repository.getById(backup.id)).attempts, 2)
    assert.equal(backupReads, 2); assert.equal((await restorePoints.list(guildId, actorId)).length, 2)
    assert.equal((await restorePoints.get(restored.result.id, guildId, actorId)).snapshot.guildId, guildId)
    const client = await queue.client
    const locks = require('../handlers/jobs/guild-lock').createGuildLock({ client: () => client, prefix: `${queueName}:lease-check`, ttl: 600 })
    await locks.run('renew', async lease => {
      await new Promise(resolve => setTimeout(resolve, 800)); await lease.assertOwned()
      assert.ok(await client.pttl(`${queueName}:lease-check:renew`) > 0)
    })
    const replacement = `${queueName}:lease-check:replacement`
    await assert.rejects(locks.run('replacement', async lease => {
      await client.set(replacement, 'new-owner', 'PX', 5000)
      await lease.assertOwned()
    }), error => error.code === 'guild_lock_lost')
    assert.equal(await client.get(replacement), 'new-owner'); await client.del(replacement)
    return { scope: 'isolated MongoDB and Redis/BullMQ; fixture Discord provider', concurrentIdempotency: true,
      privateScopes: true, realStepsAndResult: true, cancellation: true, boundedRetries: true,
      staleWorkerFenced: true, persistedCheckpointRecovery: true, dispatchRecoveryAfterRestart: true, missingRunningDeliveryRecovery: true, permissionRevocation: true,
      guildExclusion: true, contentionDelayedWithoutFailureRetry: true, otherGuildParallel: true, leaseRenewal: true, replacementLeaseProtected: true,
      immutablePrivateRestorePoints: true, restorePointRecoveryAfterPersistence: true }
  } finally {
    release?.()
    await runtime?.close()
    if (queue) { await queue.obliterate({ force: true }); await queue.close() }
    if (model) await model.deleteMany({ guildId: { $in: [guildId, 'other_jobs_fixture'] }, actorId })
    if (restoreModel) await restoreModel.deleteMany({ guildId, actorId })
    await mongoose.disconnect()
  }
}
main().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error); process.exitCode = 1 })
