const { randomUUID, randomBytes, createHash, timingSafeEqual } = require('node:crypto')
const { identifier, JobError } = require('../jobs/service')
const { snapshotGuild } = require('./snapshot')
const { affectedResources } = require('./reorders')
const hash = value => createHash('sha256').update(value).digest()
function compileEdits(diff) {
  if (!diff?.changes?.length) throw new JobError('Cannot apply an empty proposal', 'application_unsupported')
  const operations = new Map()
  const reorders = { roles: [], channels: [] }
  const categories = diff.changes.filter(change => change.operation === 'overwrites' && change.resourceType === 4)
  const category = categories[0]
  if (category && (categories.length !== 1 || category.cascadeValid !== true || !Array.isArray(category.cascadeIds) ||
      diff.changes.some(change => change.operation === 'create' || (change.operation === 'move' && change.kind === 'channels' && change.before.parentId !== change.after.parentId) ||
        (change.operation === 'overwrites' && change.id !== category.id && !category.cascadeIds.includes(change.id))))) {
    throw new JobError('Category cascade must be complete and applied separately from creations, parent moves and other channel permissions', 'application_unsupported')
  }
  for (const change of diff.changes) {
    if (category && change.operation === 'overwrites' && category.cascadeIds.includes(change.id)) continue
    if (change.operation === 'create') {
      if (!require('./creations').supportedCreation(change.kind, change.after)) throw new JobError('Creation options not supported', 'application_unsupported')
      operations.set(`${change.kind}:${change.id}`, { id: `create-${operations.size + 1}`, action: 'create', kind: change.kind, resourceId: change.id, fields: structuredClone(change.after) })
      continue
    }
    if (change.operation === 'move' && change.before.position !== change.after.position &&
        (change.kind === 'roles' || (change.kind === 'channels' && [0, 2, 4].includes(change.resourceType) && change.before.parentId === change.after.parentId))) {
      reorders[change.kind].push({ id: change.id, position: change.after.position })
      continue
    }
    if (change.operation === 'move' && change.kind === 'channels' && [0, 2].includes(change.resourceType) && change.before.position === change.after.position && change.before.parentId !== change.after.parentId) {
      operations.set(`${change.kind}:${change.id}:move`, { id: `move-${operations.size + 1}`, action: 'move', kind: 'channels', resourceId: change.id, fields: { parentId: change.after.parentId } })
      continue
    }
    if ((change.kind === 'roles' && change.operation === 'update' && change.field === 'permissions') || (change.kind === 'channels' && change.operation === 'overwrites' && [0, 2, 4].includes(change.resourceType))) {
      operations.set(`${change.kind}:${change.id}:permissions`, { id: `permissions-${operations.size + 1}`, action: 'permissions', kind: change.kind, resourceId: change.id,
        ...(change.resourceType === 4 ? { cascadeIds: [...change.cascadeIds], resourceIds: [change.id, ...change.cascadeIds] } : {}),
        fields: change.kind === 'roles' ? { permissions: change.after } : { overwrites: structuredClone(change.after) } })
      continue
    }
    const allowed = { channels: ['name', 'topic'], roles: ['name', 'color'] }
    if (change.operation !== 'update' || !allowed[change.kind]?.includes(change.field)) throw new JobError('Only existing resource name/topic/color edits are supported', 'application_unsupported')
    const id = `${change.kind}:${change.id}`
    if (!operations.has(id)) operations.set(id, { id: `edit-${operations.size + 1}`, kind: change.kind, resourceId: change.id, fields: {} })
    operations.get(id).fields[change.field] = change.after
  }
  for (const kind of ['roles', 'channels']) {
    if (!reorders[kind].length) continue
    if (diff.changes.some(change => change.kind === kind && change.operation === 'create') || (kind === 'channels' && [...operations.values()].some(operation => operation.action === 'move'))) throw new JobError('Mixed creation/parent movement and reorder not supported', 'application_unsupported')
    const positions = reorders[kind].sort((a, b) => a.id.localeCompare(b.id))
    operations.set(`${kind}:reorder`, { id: `reorder-${kind}-${operations.size + 1}`, action: 'reorder', kind, resourceIds: positions.map(entry => entry.id), fields: { positions } })
  }
  if (operations.size > 1000) throw new JobError('Plans over 1000 operations are not supported', 'application_unsupported')
  const rank = operation => operation.action === 'reorder' ? operation.kind === 'roles' ? 0.5 : 3.5 : operation.action === 'move' ? 3 : operation.action === 'permissions' ? operation.kind === 'roles' ? 4 : 5 : operation.kind === 'roles' ? 0 : operation.action === 'create' && operation.fields.type === 4 ? 1 : 2
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
      return { id, confirmation, revision: proposal.diff.revision, expiresAt, edits: new Set(operations.filter(operation => operation.action !== 'create').flatMap(operation => affectedResources(operation).map(id => `${operation.kind}:${id}`))).size,
        reorders: operations.filter(operation => operation.action === 'reorder').reduce((count, operation) => count + operation.resourceIds.length, 0),
        permissionChanges: operations.filter(operation => operation.action === 'permissions').length,
        cascadedChannels: operations.reduce((count, operation) => count + (operation.cascadeIds?.length || 0), 0),
        moves: operations.filter(operation => operation.action === 'move').length,
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
