const { isDeepStrictEqual } = require('node:util')
const { JobError } = require('../handlers/jobs/service')
const { snapshotGuild, structureRevision } = require('../handlers/architect/snapshot')
const { validateBlueprint } = require('../handlers/architect/blueprint')
const { diffBlueprint } = require('../handlers/architect/diff')
const { compileEdits } = require('../handlers/architect/application')
const { preflight } = require('../handlers/architect/preflight')
const { creationOptions, installArchitectRetryGuard, verifyCreation, reconcileCreation, reasonFor } = require('../handlers/architect/creations')
const { affectedResources, projectReorder, applyReorder } = require('../handlers/architect/reorders')
function createEditExecutor({ repository, restorePoints, guildOperations, snapshot = snapshotGuild, check = preflight, enabled = () => false }) {
  function result(record) {
    return { applicationId: record.applicationId, restorePointId: record.restorePointId, edits: new Set(record.payload.operations.filter(op => op.action !== 'create').flatMap(op => affectedResources(op).map(id => `${op.kind}:${id}`))).size,
      reorders: record.payload.operations.filter(op => op.action === 'reorder').reduce((count, op) => count + op.resourceIds.length, 0),
      permissionChanges: record.payload.operations.filter(op => op.action === 'permissions').length,
      cascadedChannels: record.payload.operations.reduce((count, op) => count + (op.cascadeIds?.length || 0), 0),
      moves: record.payload.operations.filter(op => op.action === 'move').length,
      creates: record.payload.operations.filter(op => op.action === 'create').length, idMap: { ...(record.executionIdMap || {}) },
      revision: record.executionRevision, capturedAt: new Date(record.updatedAt || Date.now()).toISOString(),
      channelCount: (record.executionSnapshot || record.payload.snapshot).channels.length, roleCount: (record.executionSnapshot || record.payload.snapshot).roles.length }
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
      async function recoverCreation(index, operation) {
        await lease.assertOwned()
        current = await repository.getById(record._id)
        if (current.steps[index].status === 'completed') return
        const before = current.executionSnapshot
        if (!before || before.revision !== current.executionRevision) throw new JobError('Creation baseline unavailable', 'application_needs_review')
        const realId = await reconcileCreation(guild, operation, record._id)
        const applied = await snapshot(guild), idMap = { ...(current.executionIdMap || {}), [operation.resourceId]: realId }
        if (!realId || !verifyCreation(before, applied, operation, realId, current.executionIdMap || {})) throw new JobError('Creation evidence incomplete', 'application_needs_review')
        if ((await check(guild, blueprint, diff, record.actorId, { executionAvailable: true, idMap, observed: applied })).status !== 'passed') throw new JobError('Creation permissions changed', 'application_needs_review')
        await lease.assertOwned()
        if ((await snapshot(guild)).revision !== applied.revision || !await repository.completeEdit(record._id, record.token, index, applied.revision, undefined, { snapshot: applied, idMap })) throw new JobError('Creation checkpoint unavailable', 'application_needs_review')
      }
      for (let offset = 0; offset < payload.operations.length; offset++) {
        if (current.steps[offset + 1].status !== 'executing') continue
        const operation = payload.operations[offset]
        if (operation.action !== 'create') throw new JobError('Interrupted edit outcome unknown', 'application_needs_review')
        await recoverCreation(offset + 1, operation)
        current = await repository.getById(record._id)
      }
      if (current.steps.every(step => step.status === 'completed')) { releaseSafe = true; return result(current) }
      if (new Date(payload.expiresAt).getTime() <= Date.now()) throw new JobError('Application expired', 'application_expired')
      async function verify() {
        await lease.assertOwned()
        current = await repository.getById(record._id)
        const observed = await snapshot(guild)
        if (observed.revision !== current.executionRevision) throw new JobError('Snapshot changed', 'revision_conflict')
        if ((await check(guild, blueprint, diff, record.actorId, { executionAvailable: true, idMap: current.executionIdMap || {}, observed })).status !== 'passed') throw new JobError('Preflight blocked', 'application_blocked')
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
        if (operation.action === 'create') {
          // Install on the shared REST manager so its rate buckets stay authoritative.
          installArchitectRetryGuard(guild.client?.rest)
          const options = creationOptions(operation, current.executionIdMap || {}, reasonFor(record._id, operation))
          if (!await repository.startEdit(record._id, record.token, index)) throw new JobError('Job no longer active', 'job_cancelled')
          try {
            await lease.assertOwned()
            const resource = await guild[operation.kind].create(options)
            const applied = await snapshot(guild), idMap = { ...(current.executionIdMap || {}), [operation.resourceId]: resource?.id }
            if (!verifyCreation(observed, applied, operation, resource?.id, current.executionIdMap || {})) throw new Error('Unexpected structure after creation')
            if ((await check(guild, blueprint, diff, record.actorId, { executionAvailable: true, idMap, observed: applied })).status !== 'passed') throw new Error('Creation permissions changed')
            await lease.assertOwned()
            if ((await snapshot(guild)).revision !== applied.revision) throw new Error('Structure changed after creation')
            if (!await repository.completeEdit(record._id, record.token, index, applied.revision, undefined, { snapshot: applied, idMap })) throw new Error('Checkpoint not acknowledged')
          } catch {
            // Positive provider evidence can finish a step; absence never permits a replay.
            try { await recoverCreation(index, operation) } catch { throw new JobError('Creation outcome needs review', 'application_needs_review') }
          }
          continue
        }
        const expected = operation.action === 'reorder' ? projectReorder(observed, operation) : structuredClone(observed)
        const target = operation.action === 'reorder' ? null : expected[operation.kind].find(resource => resource.id === operation.resourceId)
        if (!target && operation.action !== 'reorder') throw new JobError('Resource missing', 'revision_conflict')
        const fields = structuredClone(operation.fields)
        if (operation.cascadeIds) require('../handlers/architect/cascades').projectCategoryPermissions(expected, operation, current.executionIdMap || {})
        if (operation.action === 'move') fields.parentId = fields.parentId == null ? null : current.executionIdMap?.[fields.parentId] || fields.parentId
        if (operation.action === 'permissions' && operation.kind === 'channels') fields.overwrites = fields.overwrites.map(overwrite => ({ ...overwrite, id: current.executionIdMap?.[overwrite.id] || overwrite.id })).sort((a, b) => a.id.localeCompare(b.id))
        const postflight = ['permissions', 'move', 'reorder'].includes(operation.action)
        if (postflight) installArchitectRetryGuard(guild.client?.rest)
        if (target) Object.assign(target, fields)
        if (operation.kind === 'roles' && Object.hasOwn(operation.fields, 'color') && expected.roleColors?.[operation.resourceId]) expected.roleColors[operation.resourceId].primaryColor = operation.fields.color
        const revision = structureRevision(expected.channels, expected.roles, expected.roleColors)
        if (!await repository.startEdit(record._id, record.token, index)) throw new JobError('Job no longer active', 'job_cancelled')
        releaseSafe = false
        // Write-ahead state precedes REST. Any error after this point keeps the durable guild guard.
        try {
          await lease.assertOwned()
          const patch = { ...fields, reason: reasonFor(record._id, operation) }
          if (operation.action === 'move') { patch.parent = patch.parentId; patch.lockPermissions = false; delete patch.parentId }
          if (operation.action === 'permissions') {
            if (operation.kind === 'roles') patch.permissions = BigInt(patch.permissions)
            else { patch.permissionOverwrites = patch.overwrites.map(overwrite => ({ ...overwrite, allow: BigInt(overwrite.allow), deny: BigInt(overwrite.deny) })); delete patch.overwrites }
          }
          if (operation.kind === 'roles' && Object.hasOwn(patch, 'color')) {
            patch.colors = { primaryColor: patch.color, secondaryColor: null, tertiaryColor: null }; delete patch.color
          }
          if (operation.action === 'reorder') await applyReorder(guild, operation, patch.reason)
          else await guild[operation.kind].edit(operation.resourceId, patch)
          const applied = await snapshot(guild)
          if (applied.revision !== revision) throw new Error('Unexpected structure after edit')
          if (postflight && (await check(guild, blueprint, diff, record.actorId, { executionAvailable: true, idMap: current.executionIdMap || {}, observed: applied })).status !== 'passed') throw new Error('Access changed after application')
          await lease.assertOwned()
          if (postflight && (await snapshot(guild)).revision !== revision) throw new Error('Structure changed after access check')
          if (!await repository.completeEdit(record._id, record.token, index, revision, undefined, current.executionSnapshot ? { snapshot: applied, idMap: current.executionIdMap || {} } : undefined)) throw new Error('Checkpoint not acknowledged')
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
