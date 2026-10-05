const { randomUUID } = require('node:crypto')
class JobError extends Error {
  constructor(message, code = 'invalid_job') { super(message); this.code = code }
}
const terminal = new Set(['completed', 'failed', 'cancelled'])
function identifier(value, label) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) throw new JobError(`Invalid ${label}`)
  return value
}
function project(job, summary = false) {
  if (!job) return null
  return { id: job._id, type: job.type, status: job.status, correlationId: job.correlationId,
    progress: job.progress, steps: job.steps, result: job.status === 'completed' ? (summary ? job.resultSummary : job.result) : null,
    error: job.error || null, cancelRequested: Boolean(job.cancelRequested),
    createdAt: job.createdAt, updatedAt: job.updatedAt }
}
function createJobsService({ repository, transport, storageReady = () => true, prepareApply }) {
  const available = () => Boolean(storageReady() && transport.available())
  async function deliver(record) {
    try {
      await transport.add(record)
      await repository.markDispatched(record._id)
    } catch { /* The persisted queued record is the dispatch outbox. Repair retries it. */ }
  }
  function scope(id, guildId, actorId) { identifier(id, 'job ID'); identifier(guildId, 'guild'); identifier(actorId, 'actor') }
  function requireStorage() { if (!storageReady()) throw new JobError('Job storage unavailable', 'jobs_unavailable') }
  return {
    available,
    async submit(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new JobError('Invalid job')
      for (const key of Object.keys(input)) if (!['guildId', 'actorId', 'type', 'idempotencyKey', 'applicationId'].includes(key)) throw new JobError('Unknown job field')
      identifier(input.guildId, 'guild'); identifier(input.actorId, 'actor'); identifier(input.idempotencyKey, 'idempotency key')
      const apply = input.type === 'architect.apply'
      if (!['architect.snapshot', 'architect.backup'].includes(input.type) && !(apply && prepareApply)) throw new JobError('Unsupported job type')
      if (apply) identifier(input.applicationId, 'application')
      else if (input.applicationId !== undefined) throw new JobError('Unknown job field')
      if (!available()) throw new JobError('Jobs unavailable', 'jobs_unavailable')
      const payload = apply ? await prepareApply(input) : undefined
      if (apply && !payload) throw new JobError('Application not confirmed', 'application_conflict')
      const record = await repository.ensure({ _id: randomUUID(), guildId: input.guildId, actorId: input.actorId,
        type: input.type, idempotencyKey: input.idempotencyKey, correlationId: randomUUID(),
        ...(apply ? { applicationId: input.applicationId, payload } : {}) })
      if (record.type !== input.type || record.applicationId !== input.applicationId) throw new JobError('Idempotency key reused', 'job_conflict')
      if (record.status === 'queued') await deliver(record)
      return project(record)
    },
    async list(guildId, actorId) {
      identifier(guildId, 'guild'); identifier(actorId, 'actor'); requireStorage()
      return (await repository.list(guildId, actorId)).map(job => project(job, true))
    },
    async get(id, guildId, actorId) { scope(id, guildId, actorId); requireStorage(); return project(await repository.get(id, guildId, actorId)) },
    async cancel(id, guildId, actorId) { scope(id, guildId, actorId); requireStorage(); return project(await repository.cancel(id, guildId, actorId)) },
    async repair() {
      if (!available()) return
      for (const record of await repository.pending()) {
        if (!available()) break
        await deliver(record)
      }
    },
  }
}
module.exports = { createJobsService, JobError, identifier, terminal }
