const { randomUUID, randomBytes, createHash, timingSafeEqual } = require('node:crypto')
const { identifier, JobError } = require('../jobs/service')
const { snapshotGuild } = require('./snapshot')
const hash = value => createHash('sha256').update(value).digest()
function compileEdits(diff) {
  if (!diff?.changes?.length) throw new JobError('Cannot apply an empty proposal', 'application_unsupported')
  const operations = new Map()
  for (const change of diff.changes) {
    if (change.operation === 'create') {
      if (!require('./creations').supportedCreation(change.kind, change.after)) throw new JobError('Creation options not supported', 'application_unsupported')
      operations.set(`${change.kind}:${change.id}`, { id: `create-${operations.size + 1}`, action: 'create', kind: change.kind, resourceId: change.id, fields: structuredClone(change.after) })
      continue
    }
    const allowed = { channels: ['name', 'topic'], roles: ['name', 'color'] }
    if (change.operation !== 'update' || !allowed[change.kind]?.includes(change.field)) throw new JobError('Only existing resource name/topic/color edits are supported', 'application_unsupported')
    const id = `${change.kind}:${change.id}`
    if (!operations.has(id)) operations.set(id, { id: `edit-${operations.size + 1}`, kind: change.kind, resourceId: change.id, fields: {} })
    operations.get(id).fields[change.field] = change.after
  }
  const rank = operation => operation.kind === 'roles' ? 0 : operation.action === 'create' && operation.fields.type === 4 ? 1 : 2
  return [...operations.values()].sort((a, b) => rank(a) - rank(b))
}
function createApplicationService({ repository, preview, jobs, enabled = () => false, snapshot = snapshotGuild, storageReady = () => true }) {
  function requireEnabled(guild) {
    if (!enabled(guild)) throw new JobError('Application unavailable', 'apply_unavailable')
    if (!storageReady()) throw new JobError('Application storage unavailable', 'storage_unavailable')
  }
  return {
    available: enabled,
    async prepare(guild, actorId, blueprint) {
      identifier(guild?.id, 'guild'); identifier(actorId, 'actor'); requireEnabled(guild)
      const proposal = await preview(guild, blueprint, actorId)
      const operations = compileEdits(proposal.diff)
      if (operations.some(operation => operation.action !== 'create' && operation.kind === 'channels' && Object.hasOwn(operation.fields, 'topic') && proposal.snapshot.channels?.find(channel => channel.id === operation.resourceId)?.type !== 0)) throw new JobError('Only text channel topics supported', 'application_unsupported')
      if (proposal.preflight.status !== 'passed') throw new JobError('Preflight incomplete', 'application_blocked')
      if (!jobs()?.available()) throw new JobError('Jobs unavailable', 'jobs_unavailable')
      const id = randomUUID(), confirmation = randomBytes(32).toString('hex'), expiresAt = new Date(Date.now() + 15 * 60 * 1000)
      await repository.create({ _id: id, guildId: guild.id, actorId, confirmationDigest: hash(confirmation).toString('hex'), expiresAt,
        payload: { schemaVersion: 1, snapshot: proposal.snapshot, blueprint: proposal.blueprint, operations, revision: proposal.diff.revision, expiresAt } })
      return { id, confirmation, revision: proposal.diff.revision, expiresAt, edits: operations.filter(operation => operation.action !== 'create').length,
        creates: operations.filter(operation => operation.action === 'create').length, changes: proposal.diff.changes.length,
        review: { blueprint: proposal.blueprint, diff: proposal.diff, preflight: proposal.preflight } }
    },
    async confirm(guild, actorId, input) {
      identifier(guild?.id, 'guild'); identifier(actorId, 'actor'); identifier(input?.id, 'application'); requireEnabled(guild)
      const plan = await repository.get(input.id, guild.id, actorId)
      if (!plan) throw new JobError('Application not found', 'application_not_found')
      if (typeof input.confirmation !== 'string' || !/^[a-f0-9]{64}$/.test(input.confirmation) ||
          !timingSafeEqual(hash(input.confirmation), Buffer.from(plan.confirmationDigest, 'hex')) || input.revision !== plan.payload.revision) throw new JobError('Confirmation changed', 'application_conflict')
      if (new Date(plan.expiresAt).getTime() <= Date.now()) throw new JobError('Application expired', 'application_expired')
      if (!jobs()?.available()) throw new JobError('Jobs unavailable', 'jobs_unavailable')
      if (!plan.confirmed) {
        if ((await snapshot(guild)).revision !== plan.payload.snapshot.revision) throw new JobError('Snapshot revision changed', 'revision_conflict')
        if (!await repository.confirm(input.id, guild.id, actorId)) throw new JobError('Confirmation changed', 'application_conflict')
      }
      return jobs().submit({ guildId: guild.id, actorId, type: 'architect.apply', applicationId: input.id, idempotencyKey: `apply-${input.id}` })
    },
    async payload(id, guildId, actorId) {
      identifier(id, 'application'); identifier(guildId, 'guild'); identifier(actorId, 'actor')
      if (!storageReady()) throw new JobError('Application storage unavailable', 'storage_unavailable')
      const plan = await repository.get(id, guildId, actorId)
      return plan?.confirmed && new Date(plan.expiresAt).getTime() > Date.now() ? structuredClone(plan.payload) : null
    },
  }
}
module.exports = { createApplicationService, compileEdits }
