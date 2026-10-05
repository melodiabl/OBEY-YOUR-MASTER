const { createJobsService, JobError } = require('./service')
const { createJobProcessor } = require('../../workers')
function connectionOptions(redisUrl) {
  let url
  try { url = new URL(redisUrl) } catch { throw new JobError('Invalid jobs Redis configuration') }
  if (!['redis:', 'rediss:'].includes(url.protocol) || !url.hostname || url.search || url.hash || !/^\/(\d+)?$/.test(url.pathname || '/')) throw new JobError('Invalid jobs Redis configuration')
  const db = Number(url.pathname.slice(1) || 0), port = Number(url.port || 6379)
  if (!Number.isSafeInteger(db) || db > 15 || port < 1 || port > 65535) throw new JobError('Invalid jobs Redis configuration')
  return { host: url.hostname, port, db, username: decodeURIComponent(url.username) || undefined,
    password: decodeURIComponent(url.password) || undefined, ...(url.protocol === 'rediss:' ? { tls: {} } : {}), connectTimeout: 3000 }
}
async function readyWithin(promise) {
  let timer
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new JobError('Jobs connection unavailable')), 5000) })]) }
  finally { clearTimeout(timer) }
}
function createJobsRuntime({ repository, handlers, authorize, prepareApply, redisUrl, storageReady = () => true, queueName = 'obey-jobs', onError = () => {} }) {
  let queue, worker, redisClient, timer, repairing, closing = false, starting
  const settlements = new Set()
  const transport = {
    available: () => Boolean(!closing && redisClient?.status === 'ready' && worker?.isRunning()),
    async add(record) {
      const delivery = await queue.add(record.type, { recordId: record._id }, {
        jobId: record._id, attempts: 3, backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 1000 }, removeOnFail: { count: 1000 },
      })
      if (await delivery.getState() === 'failed') await repository.deliveryFailed(record._id)
    },
  }
  const service = createJobsService({ repository, transport, storageReady, prepareApply })
  const locks = require('./guild-lock').createGuildLock({ client: () => redisClient, prefix: `${queueName}:guild-lock` })
  async function repair() {
    if (repairing) return repairing
    if (closing) return
    repairing = service.repair().catch(() => onError('dispatch_unavailable'))
    try { await repairing } finally { repairing = null }
  }
  async function start() {
    if (starting) return starting
    if (closing || worker) return
    starting = (async () => {
      const { Queue, Worker, UnrecoverableError, DelayedError } = require('bullmq')
      const connection = connectionOptions(redisUrl)
      try {
        queue = new Queue(queueName, { connection: { ...connection, maxRetriesPerRequest: 1, enableOfflineQueue: false, commandTimeout: 3000 } })
        queue.on('error', () => onError('redis_unavailable'))
        redisClient = await readyWithin(queue.waitUntilReady())
        const guardedHandlers = Object.fromEntries(Object.entries(handlers).map(([type, handler]) => [type, record => locks.run(record.guildId, async lease => {
          const assertOwned = async () => {
            await lease.assertOwned()
            const current = await repository.getById(record._id)
            if (current?.token !== record.token || current.cancelRequested) throw new JobError('Job no longer active', 'job_cancelled')
          }
          await assertOwned()
          const result = await handler(record, { assertOwned })
          await assertOwned()
          return result
        })]))
        const processJob = createJobProcessor({ repository, handlers: guardedHandlers, authorize })
        worker = new Worker(queueName, async (job, token) => {
          try { return await processJob(job) }
          catch (error) {
            if (error.code === 'guild_locked') { await job.moveToDelayed(Date.now() + 1000, token); throw new DelayedError() }
            if (error instanceof JobError) throw new UnrecoverableError(error.code)
            throw new Error('job_unavailable')
          }
        }, { connection: { ...connection, maxRetriesPerRequest: null }, concurrency: 2, autorun: false })
        worker.on('error', () => onError('worker_unavailable'))
        worker.on('failed', job => {
          const settlement = (async () => {
            if (job && await job.getState() === 'failed') await repository.deliveryFailed(job.data.recordId)
          })().catch(() => onError('job_status_unavailable'))
          settlements.add(settlement); settlement.finally(() => settlements.delete(settlement))
        })
        await readyWithin(worker.waitUntilReady())
        if (closing) return
        worker.run().catch(() => onError('worker_stopped'))
        timer = setInterval(repair, 5000); timer.unref()
        await repair()
      } catch (error) {
        await worker?.close(true).catch(() => {})
        await queue?.close().catch(() => {})
        worker = null; queue = null; redisClient = null
        throw new JobError('Jobs connection unavailable', 'jobs_unavailable')
      }
    })()
    try { await starting } finally { starting = null }
  }
  async function close() {
    closing = true; clearInterval(timer)
    await starting?.catch(() => {})
    await repairing
    await worker?.close()
    await Promise.all(settlements)
    await queue?.close()
    worker = null; queue = null; redisClient = null
  }
  return { ...service, start, close }
}
module.exports = { createJobsRuntime, connectionOptions }
