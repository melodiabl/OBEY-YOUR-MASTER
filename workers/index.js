const { randomUUID } = require('node:crypto')
const { JobError, identifier, terminal } = require('../handlers/jobs/service')
function createJobProcessor({ repository, handlers, authorize = async () => {} }) {
  return async job => {
    const id = identifier(job.data?.recordId, 'job ID')
    const existing = await repository.getById(id)
    if (!existing) throw new JobError('Job record missing')
    if (terminal.has(existing.status)) return { status: existing.status }
    if (existing.cancelRequested) return { status: (await repository.finalizeCancellation(id))?.status }
    if (!Object.hasOwn(handlers, existing.type)) throw new JobError('Unsupported job type')
    const token = randomUUID(), record = await repository.begin(id, token)
    if (!record) return { status: (await repository.getById(id))?.status }
    try {
      await authorize(record)
      const current = await repository.getById(id)
      if (current?.token !== token) return { status: current?.status }
      if (current.cancelRequested) return { status: (await repository.finish(id, token, 'completed'))?.status }
      if (record.steps[0].status !== 'completed') {
        const result = await handlers[record.type](record)
        await repository.checkpoint(id, token, result)
      }
      const finished = await repository.finish(id, token, 'completed')
      return { status: finished?.status }
    } catch (error) {
      const finalAttempt = error instanceof JobError || (job.attemptsMade || 0) + 1 >= (job.opts?.attempts || 1)
      const failed = await repository.finish(id, token, finalAttempt ? 'failed' : 'queued', {
        code: error instanceof JobError ? error.code : 'snapshot_unavailable',
        message: error.code === 'permission_denied' ? 'Ya no tienes permiso para analizar este servidor.' : 'No se pudo completar el análisis de estructura.',
      })
      if (failed?.status === 'cancelled') return { status: 'cancelled' }
      throw error
    }
  }
}
module.exports = { createJobProcessor }
