const { isDeepStrictEqual } = require('node:util')
const { JobError } = require('../handlers/jobs/service')
const { snapshotGuild, structureRevision } = require('../handlers/architect/snapshot')
const { validateBlueprint } = require('../handlers/architect/blueprint')
const { diffBlueprint } = require('../handlers/architect/diff')
const { compileEdits } = require('../handlers/architect/application')
const { preflight } = require('../handlers/architect/preflight')
function createEditExecutor({ repository, restorePoints, guildOperations, snapshot = snapshotGuild, check = preflight, enabled = () => false }) {
  function result(record) {
    return { applicationId: record.applicationId, restorePointId: record.restorePointId, edits: record.payload.operations.length,
      revision: record.executionRevision, capturedAt: new Date(record.updatedAt || Date.now()).toISOString(),
      channelCount: record.payload.snapshot.channels.length, roleCount: record.payload.snapshot.roles.length }
  }
  return async (guild, record, lease) => {
    if (!enabled(guild)) throw new JobError('Application unavailable', 'apply_unavailable')
    const payload = record.payload
    if (payload?.schemaVersion !== 1 || payload.snapshot?.guildId !== guild.id) throw new JobError('Invalid application scope/version', 'application_conflict')
    const blueprint = validateBlueprint(payload.blueprint, payload.snapshot), diff = diffBlueprint(payload.snapshot, blueprint)
    if (diff.revision !== payload.revision || !isDeepStrictEqual(compileEdits(diff), payload.operations)) throw new JobError('Application changed', 'application_conflict')
    let current = await repository.getById(record._id)
    await lease.assertOwned()
    if (current.executionAborted) {
      await guildOperations.release(guild.id, record._id)
      throw new JobError('Application aborted before edits', 'application_blocked')
    }
    if (current.steps.every(step => step.status === 'completed')) {
      await guildOperations.release(guild.id, record._id)
      return result(current)
    }
    if (!await guildOperations.claim(guild.id, record._id)) throw new JobError('Unresolved guild operation', 'application_needs_review')
    let releaseSafe = false
    try {
      if (current.steps.some(step => step.status === 'executing')) throw new JobError('Interrupted edit outcome unknown', 'application_needs_review')
      if (new Date(payload.expiresAt).getTime() <= Date.now()) throw new JobError('Application expired', 'application_expired')
      async function verify() {
        await lease.assertOwned()
        current = await repository.getById(record._id)
        const observed = await snapshot(guild)
        if (observed.revision !== current.executionRevision) throw new JobError('Snapshot changed', 'revision_conflict')
        if ((await check(guild, blueprint, diff, record.actorId, { executionAvailable: true })).status !== 'passed') throw new JobError('Preflight blocked', 'application_blocked')
        await lease.assertOwned()
        if ((await snapshot(guild)).revision !== observed.revision) throw new JobError('Snapshot changed', 'revision_conflict')
        return observed
      }
      await verify()
      if (current.steps[0].status !== 'completed') {
        const point = await restorePoints.create(guild, record.actorId, record._id, lease, 'before_apply')
        if (point.revision !== current.executionRevision) throw new JobError('Snapshot changed before backup', 'revision_conflict')
        if (!await repository.completeEdit(record._id, record.token, 0, point.revision, point.id)) throw new JobError('Job no longer active', 'job_cancelled')
      }
      for (let offset = 0; offset < payload.operations.length; offset++) {
        const index = offset + 1, operation = payload.operations[offset]
        const observed = await verify()
        if (current.steps[index].status === 'completed') continue
        const expected = structuredClone(observed), target = expected[operation.kind].find(resource => resource.id === operation.resourceId)
        if (!target) throw new JobError('Resource missing', 'revision_conflict')
        Object.assign(target, operation.fields)
        if (operation.kind === 'roles' && Object.hasOwn(operation.fields, 'color') && expected.roleColors?.[operation.resourceId]) expected.roleColors[operation.resourceId].primaryColor = operation.fields.color
        const revision = structureRevision(expected.channels, expected.roles, expected.roleColors)
        if (!await repository.startEdit(record._id, record.token, index)) throw new JobError('Job no longer active', 'job_cancelled')
        releaseSafe = false
        // Write-ahead state precedes REST. Any error after this point keeps the durable guild guard.
        try {
          await lease.assertOwned()
          const patch = { ...operation.fields, reason: `OBEY Architect ${record._id} / ${operation.id}` }
          if (operation.kind === 'roles' && Object.hasOwn(patch, 'color')) {
            patch.colors = { primaryColor: patch.color, secondaryColor: null, tertiaryColor: null }; delete patch.color
          }
          await guild[operation.kind].edit(operation.resourceId, patch)
          const applied = await snapshot(guild)
          if (applied.revision !== revision) throw new Error('Unexpected structure after edit')
          await lease.assertOwned()
          if (!await repository.completeEdit(record._id, record.token, index, revision)) throw new Error('Checkpoint not acknowledged')
        } catch { throw new JobError('Edit outcome needs review', 'application_needs_review') }
      }
      current = await repository.getById(record._id)
      releaseSafe = true
      return result(current)
    } catch (error) {
      if (error instanceof JobError) releaseSafe = await repository.abortEdits(record._id, record.token)
      throw error
    } finally {
      if (releaseSafe) await guildOperations.release(guild.id, record._id)
    }
  }
}
module.exports = { createEditExecutor }
