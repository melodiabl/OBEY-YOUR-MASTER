// Actual isolated Mongo/Redis/BullMQ, mutable Discord fixture. Never load dotenv/login a bot.
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const mongoose = require('mongoose')
const { Queue } = require('bullmq')
const { Client, Guild, PermissionsBitField } = require('discord.js')
const { createJobsRuntime, connectionOptions } = require('../handlers/jobs/runtime')
const { createJobRepository } = require('../handlers/jobs/repository')
const { JobError } = require('../handlers/jobs/service')
const mongoUrl = process.env.OBEY_JOBS_TEST_MONGO_URL, redisUrl = process.env.OBEY_JOBS_TEST_REDIS_URL
if (!/^mongodb:\/\/127\.0\.0\.1:\d+\/obey_jobs_test$/.test(mongoUrl || '') || !/^redis:\/\/127\.0\.0\.1:\d+\/15$/.test(redisUrl || '')) throw new Error('Explicit isolated application fixtures required')
async function until(check) {
  for (let attempt = 0; attempt < 200; attempt++) { const value = await check(); if (value) return value; await new Promise(resolve => setTimeout(resolve, 50)) }
  throw new Error('Timed out waiting for fixture application')
}
async function main() {
  const guildId = 'apply_fixture', actorId = 'apply_actor', queueName = `obey-apply-test-${randomUUID()}`
  let runtime, queue, jobModel, planModel, pointModel, guardModel, sdkClient, cancelRelease, permitted = true, loseResponse = false, edits = 0
  try {
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 3000 })
    jobModel = require('../database/schemas/JobSchema'); planModel = require('../database/schemas/ArchitectApplicationPlanSchema')
    pointModel = require('../database/schemas/ArchitectRestorePointSchema'); guardModel = require('../database/schemas/ArchitectGuildOperationSchema')
    const repository = createJobRepository(jobModel)
    const channel = { id: 'chat', name: 'original', type: 0, parentId: null, rawPosition: 0, topic: '', permissionOverwrites: { cache: new Map() }, permissionsFor: () => new PermissionsBitField(permitted ? 8n : 0n) }
    const roles = [{ id: guildId, name: '@everyone', position: 0, permissions: new PermissionsBitField(0n) },
      { id: 'staff', name: 'Staff', position: 1, permissions: new PermissionsBitField(0n), color: 0, colors: { primaryColor: 0, secondaryColor: null, tertiaryColor: null } },
      { id: 'bot_role', name: 'OBEY', position: 10, permissions: new PermissionsBitField(8n), managed: true }]
    const member = id => ({ id, permissions: new PermissionsBitField(permitted ? 8n : 0n), roles: { highest: { position: 10 } } })
    const guild = { id: guildId, name: 'Fixture', ownerId: actorId,
      members: { fetch: async ({ user }) => member(user), fetchMe: async () => member('bot') },
      channels: { cache: new Map([[channel.id, channel]]), fetch: async () => new Map([[channel.id, channel]]), edit: async (id, patch) => {
        edits++; assert.equal(id, channel.id); if (patch.name !== undefined) channel.name = patch.name; if (patch.topic !== undefined) channel.topic = patch.topic
        if (loseResponse) throw new Error('fixture response lost after mutation')
      } },
      roles: { cache: new Map(roles.map(role => [role.id, role])), fetch: async () => new Map(roles.map(role => [role.id, role])) },
    }
    // Use the installed RoleManager for serialization, with REST replaced before any call. No login/token.
    sdkClient = new Client({ intents: [] })
    const sdkGuild = new Guild(sdkClient, { id: guildId, name: 'Fixture', roles: [] })
    const roleData = role => ({ ...role, permissions: role.permissions.bitfield.toString(),
      ...(role.colors ? { colors: { primary_color: role.colors.primaryColor, secondary_color: role.colors.secondaryColor, tertiary_color: role.colors.tertiaryColor } } : {}) })
    for (const role of roles) sdkGuild.roles._add(roleData(role))
    sdkClient.rest.patch = async (route, { body }) => {
      edits++; const role = roles.find(role => role.id === route.split('/').at(-1)); assert.ok(role)
      assert.equal(body.permissions, undefined); assert.equal(body.color, undefined)
      if (body.colors) {
        assert.equal(body.colors.secondary_color, null); assert.equal(body.colors.tertiary_color, null)
        role.colors = { primaryColor: body.colors.primary_color, secondaryColor: body.colors.secondary_color, tertiaryColor: body.colors.tertiary_color }
        role.color = role.colors.primaryColor
      }
      if (body.name !== undefined) role.name = body.name
      return roleData(role)
    }
    guild.roles.edit = (id, patch) => sdkGuild.roles.edit(id, patch)
    let cancelledEdits = 0
    const cancelChannel = { ...channel, id: 'cancel_chat', name: 'before cancellation' }
    const cancelGuild = { ...guild, id: 'apply_cancel_fixture',
      channels: { cache: new Map([[cancelChannel.id, cancelChannel]]), fetch: async () => new Map([[cancelChannel.id, cancelChannel]]), edit: async (id, patch) => {
        assert.equal(id, cancelChannel.id); await new Promise(resolve => { cancelRelease = resolve }); cancelledEdits++; cancelChannel.name = patch.name
      } },
      roles: { fetch: async () => new Map(roles.map(role => {
        const copy = { ...role, id: role.id === guildId ? 'apply_cancel_fixture' : `cancel_${role.id}` }
        return [copy.id, copy]
      })) },
    }
    const restorePoints = require('../handlers/architect/restore-points').createRestorePointService({ repository: require('../handlers/architect/restore-point-repository').createRestorePointRepository(pointModel) })
    const architect = require('../handlers/architect/service').createArchitectService({ applyAvailable: () => true })
    const executor = require('../workers/architect-edits').createEditExecutor({ repository, restorePoints,
      guildOperations: require('../handlers/architect/application-repository').createGuildOperationRepository(guardModel), enabled: () => true })
    let applications
    runtime = createJobsRuntime({ repository, redisUrl, queueName,
      authorize: async () => { if (!permitted) throw new JobError('Permission denied', 'permission_denied') },
      prepareApply: input => applications.payload(input.applicationId, input.guildId, input.actorId),
      handlers: { 'architect.apply': (record, lease) => executor(record.guildId === cancelGuild.id ? cancelGuild : guild, record, lease) },
    })
    applications = require('../handlers/architect/application').createApplicationService({ repository: require('../handlers/architect/application-repository').createApplicationRepository(planModel),
      preview: (...args) => architect.preview(...args), jobs: () => runtime, enabled: () => true })
    await runtime.start(); queue = new Queue(queueName, { connection: connectionOptions(redisUrl) }); queue.on('error', () => {})
    async function proposal(name, color, targetGuild = guild) {
      const snapshot = (await architect.read(targetGuild, actorId)).snapshot
      const blueprint = { schemaVersion: 1, baseRevision: snapshot.revision, channels: structuredClone(snapshot.channels), roles: structuredClone(snapshot.roles), protectedIds: [] }
      if (name !== undefined) blueprint.channels[0].name = name
      if (color !== undefined) blueprint.roles.find(role => role.id === 'staff').color = color
      return blueprint
    }
    const get = id => runtime.get(id, guildId, actorId)
    const completed = id => until(async () => { const job = await get(id); return job.status === 'completed' && job })
    const failed = id => until(async () => { const job = await get(id); return job.status === 'failed' && job })
    const plan = await applications.prepare(guild, actorId, await proposal('approved', 0x123456))
    assert.equal(edits, 0)
    await assert.rejects(applications.confirm(guild, 'another_actor', plan), error => error.code === 'application_not_found')
    await assert.rejects(applications.confirm(guild, actorId, { ...plan, confirmation: '0'.repeat(64) }), error => error.code === 'application_conflict')
    const [first, duplicate] = await Promise.all([applications.confirm(guild, actorId, plan), applications.confirm(guild, actorId, plan)])
    assert.equal(first.id, duplicate.id)
    const applied = await completed(first.id)
    assert.equal(edits, 2); assert.equal(channel.name, 'approved'); assert.equal(roles.find(role => role.id === 'staff').color, 0x123456)
    assert.deepEqual(applied.progress, { completed: 3, total: 3 }); assert.ok(applied.steps.every(step => step.status === 'completed'))
    assert.equal(applied.payload, undefined)
    const point = await restorePoints.get(applied.result.restorePointId, guildId, actorId)
    assert.equal(point.origin, 'before_apply'); assert.equal(point.snapshot.channels[0].name, 'original')
    assert.equal(point.snapshot.roles.find(role => role.id === 'staff').color, 0)
    assert.equal(await runtime.get(first.id, guildId, 'another_actor'), null)
    assert.equal(await guardModel.countDocuments({ _id: guildId }), 0)
    await applications.confirm(guild, actorId, plan); assert.equal(edits, 2)
    const driftPlan = await applications.prepare(guild, actorId, await proposal('stale'))
    channel.topic = 'manual external change'
    await assert.rejects(applications.confirm(guild, actorId, driftPlan), error => error.code === 'revision_conflict')
    assert.equal(edits, 2)
    const revoked = await applications.prepare(guild, actorId, await proposal('revoked'))
    permitted = false; const denied = await applications.confirm(guild, actorId, revoked)
    assert.equal((await failed(denied.id)).error.code, 'permission_denied'); assert.equal(edits, 2)
    permitted = true
    const cancelPlan = await applications.prepare(cancelGuild, actorId, await proposal('may finish after cancellation', undefined, cancelGuild))
    const cancellation = await applications.confirm(cancelGuild, actorId, cancelPlan)
    await until(() => cancelRelease)
    await runtime.cancel(cancellation.id, cancelGuild.id, actorId); cancelRelease(); cancelRelease = null
    const cancelled = await until(async () => { const job = await runtime.get(cancellation.id, cancelGuild.id, actorId); return job.status === 'cancelled' && job })
    assert.equal(cancelledEdits, 1); assert.equal(cancelled.result, null); assert.equal(cancelled.error, null)
    assert.equal(cancelled.steps[1].status, 'executing')
    assert.equal((await guardModel.findById(cancelGuild.id).lean()).jobId, cancellation.id)
    const uncertain = await applications.prepare(guild, actorId, await proposal('uncertain'))
    loseResponse = true; const uncertainJob = await applications.confirm(guild, actorId, uncertain)
    const stopped = await failed(uncertainJob.id)
    assert.equal(stopped.error.code, 'application_needs_review'); assert.equal(stopped.steps[1].status, 'executing')
    assert.equal(edits, 3); assert.equal(channel.name, 'uncertain')
    assert.equal((await guardModel.findById(guildId).lean()).jobId, uncertainJob.id)
    loseResponse = false
    const blockedPlan = await applications.prepare(guild, actorId, await proposal('must-not-apply'))
    const blockedJob = await applications.confirm(guild, actorId, blockedPlan)
    assert.equal((await failed(blockedJob.id)).error.code, 'application_needs_review'); assert.equal(edits, 3)
    const confirmedPayload = await applications.payload(blockedPlan.id, guildId, actorId)
    const fenced = await repository.ensure({ _id: randomUUID(), guildId: 'apply_fencing_fixture', actorId, type: 'architect.apply', applicationId: blockedPlan.id,
      payload: confirmedPayload, idempotencyKey: 'fencing', correlationId: randomUUID() })
    const oldToken = randomUUID(), newToken = randomUUID()
    await repository.begin(fenced._id, oldToken); await repository.begin(fenced._id, newToken)
    assert.equal(await repository.abortEdits(fenced._id, oldToken), false)
    assert.equal(await repository.abortEdits(fenced._id, newToken), true)
    assert.equal(await repository.startEdit(fenced._id, newToken, 1), false)
    return { scope: 'isolated Mongo/Redis/BullMQ and mutable Discord fixture; no Discord network', privateRevisionBoundConfirmation: true,
      noEffectsBeforeConfirmation: true, concurrentConfirmationIdempotent: true, actualFixtureEdits: true, priorStructuralRestorePoint: true,
      measuredCheckpoints: true, duplicateDeliverySafe: true, revisionDriftRejected: true, permissionRevocation: true,
      ambiguousResponseStopsReplay: true, persistentGuildGuardBlocksAnotherApplication: true, staleAbortFenced: true,
      cancellationDuringRESTKeepsDurableGuard: true }
  } finally {
    cancelRelease?.(); await runtime?.close(); await sdkClient?.destroy()
    if (queue) { await queue.obliterate({ force: true }); await queue.close() }
    if (jobModel) await jobModel.deleteMany({ guildId: { $in: [guildId, 'apply_fencing_fixture', 'apply_cancel_fixture'] }, actorId })
    if (planModel) await planModel.deleteMany({ guildId: { $in: [guildId, 'apply_cancel_fixture'] }, actorId })
    if (pointModel) await pointModel.deleteMany({ guildId: { $in: [guildId, 'apply_cancel_fixture'] }, actorId })
    if (guardModel) await guardModel.deleteMany({ _id: { $in: [guildId, 'apply_cancel_fixture'] } })
    await mongoose.disconnect()
  }
}
main().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error); process.exitCode = 1 })
