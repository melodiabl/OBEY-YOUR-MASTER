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
  let runtime, queue, jobModel, planModel, pointModel, guardModel, sdkClient, cancelRelease, permitted = true, loseResponse = false, loseCreation = false, edits = 0, creates = 0
  try {
    await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 3000 })
    jobModel = require('../database/schemas/JobSchema'); planModel = require('../database/schemas/ArchitectApplicationPlanSchema')
    pointModel = require('../database/schemas/ArchitectRestorePointSchema'); guardModel = require('../database/schemas/ArchitectGuildOperationSchema')
    const repository = createJobRepository(jobModel)
    const channel = { id: 'chat', name: 'original', type: 0, parentId: null, rawPosition: 0, topic: '', permissionOverwrites: { cache: new Map() }, permissionsFor: () => new PermissionsBitField(permitted ? 8n : 0n) }
    const roles = [{ id: guildId, name: '@everyone', position: 0, permissions: new PermissionsBitField(0n) },
      { id: 'staff', name: 'Staff', position: 1, permissions: new PermissionsBitField(0n), color: 0, colors: { primaryColor: 0, secondaryColor: null, tertiaryColor: null } },
      { id: 'bot_role', name: 'OBEY', position: 10, permissions: new PermissionsBitField(8n), managed: true }]
    const member = id => ({ id, permissions: new PermissionsBitField(permitted ? 8n : 0n), roles: { highest: { position: 10 }, cache: new Map(roles.filter(role => role.id === guildId || role.id === 'bot_role').map(role => [role.id, role])) } })
    const guild = { id: guildId, name: 'Fixture', ownerId: actorId,
      members: { fetch: async ({ user }) => member(user), fetchMe: async () => member('bot') },
      channels: { cache: new Map([[channel.id, channel]]), fetch: async () => new Map(guild.channels.cache), edit: async (id, patch) => {
        if (patch.permissionOverwrites !== undefined || Object.hasOwn(patch, 'parent')) return sdkGuild.channels.edit(id, patch)
        edits++; assert.equal(id, channel.id); if (patch.name !== undefined) channel.name = patch.name; if (patch.topic !== undefined) channel.topic = patch.topic
        if (loseResponse) throw new Error('fixture response lost after mutation')
      } },
      roles: { cache: new Map(roles.map(role => [role.id, role])), fetch: async () => new Map(roles.map(role => [role.id, role])) },
    }
    // Use the installed RoleManager for serialization, with REST replaced before any call. No login/token.
    sdkClient = new Client({ intents: [] })
    const sdkGuild = new Guild(sdkClient, { id: guildId, name: 'Fixture', roles: [] })
    sdkClient.guilds.cache.set(guildId, sdkGuild); sdkClient.user = { id: '123456789012345600' }
    guild.client = sdkClient; guild.maximumBitrate = 96000
    const roleData = role => ({ ...role, permissions: role.permissions.bitfield.toString(),
      ...(role.colors ? { colors: { primary_color: role.colors.primaryColor, secondary_color: role.colors.secondaryColor, tertiary_color: role.colors.tertiaryColor } } : {}) })
    for (const role of roles) sdkGuild.roles._add(roleData(role))
    sdkClient.channels._add({ id: channel.id, guild_id: guildId, type: 0, name: channel.name, position: 0, permission_overwrites: [] })
    sdkClient.rest.patch = async (route, { body }) => {
      edits++; body = JSON.parse(JSON.stringify(body))
      if (Array.isArray(body)) {
        assert.ok(body.every(entry => Object.keys(entry).sort().join(',') === 'id,position'))
        if (route.endsWith('/roles')) {
          for (const entry of body) { const role = roles.find(role => role.id === entry.id); assert.ok(role && !role.managed && role.id !== guildId); role.position = entry.position }
          for (const role of roles) sdkGuild.roles._add(roleData(role))
          return roles.map(roleData)
        }
        assert.equal(route, `/guilds/${guildId}/channels`)
        for (const entry of body) { const target = guild.channels.cache.get(entry.id); assert.ok(target); target.rawPosition = entry.position }
        return null
      }
      if (route.startsWith('/channels/')) {
        const target = guild.channels.cache.get(route.split('/').at(-1)); assert.ok(target)
        assert.equal(body.position, undefined)
        if (Object.hasOwn(body, 'parent_id')) {
          assert.equal(body.lock_permissions, false); assert.equal(body.permission_overwrites, undefined)
          target.parentId = body.parent_id
        } else {
          assert.ok(Array.isArray(body.permission_overwrites))
          // Determine synced children using the installed SDK, independently of the application projector.
          for (const item of guild.channels.cache.values()) sdkClient.channels._add({ id: item.id, guild_id: guildId, type: item.type, name: item.name, parent_id: item.parentId,
            permission_overwrites: [...item.permissionOverwrites.cache.values()].map(overwrite => ({ ...overwrite, allow: String(overwrite.allow.bitfield), deny: String(overwrite.deny.bitfield) })) })
          const children = target.type === 4 ? [...guild.channels.cache.values()].filter(item => item.parentId === target.id && sdkClient.channels.cache.get(item.id).permissionsLocked) : []
          for (const item of [target, ...children]) item.permissionOverwrites.cache = new Map(body.permission_overwrites.map(overwrite => [overwrite.id, { ...overwrite, allow: new PermissionsBitField(BigInt(overwrite.allow)), deny: new PermissionsBitField(BigInt(overwrite.deny)) }]))
        }
        return { ...body, id: target.id, guild_id: guildId, type: target.type, name: target.name, position: target.rawPosition, parent_id: target.parentId, topic: target.topic,
          nsfw: target.nsfw, bitrate: target.bitrate, user_limit: target.userLimit, rate_limit_per_user: target.rateLimitPerUser }
      }
      const role = roles.find(role => role.id === route.split('/').at(-1)); assert.ok(role)
      if (body.permissions !== undefined) { assert.equal(typeof body.permissions, 'string'); role.permissions = new PermissionsBitField(BigInt(body.permissions)) }
      assert.equal(body.color, undefined)
      if (body.colors) {
        assert.equal(body.colors.secondary_color, null); assert.equal(body.colors.tertiary_color, null)
        role.colors = { primaryColor: body.colors.primary_color, secondaryColor: body.colors.secondary_color, tertiaryColor: body.colors.tertiary_color }
        role.color = role.colors.primaryColor
      }
      if (body.name !== undefined) role.name = body.name
      return roleData(role)
    }
    guild.roles.edit = (id, patch) => sdkGuild.roles.edit(id, patch)
    const auditEntries = new Map()
    guild.fetchAuditLogs = async () => ({ entries: auditEntries })
    sdkClient.rest.post = async (route, { body, reason }) => {
      creates++; body = JSON.parse(JSON.stringify(body))
      assert.equal(body.position, undefined)
      const id = String(123456789012345678n + BigInt(creates)), roleCreation = route.endsWith('/roles')
      let data
      if (roleCreation) {
        assert.equal(body.permissions, '0'); assert.equal(body.color, undefined)
        for (const existing of roles) if (existing.position > 0) existing.position++
        const role = { id, name: body.name, position: 1, permissions: new PermissionsBitField(body.permissions), color: body.colors.primary_color,
          colors: { primaryColor: body.colors.primary_color, secondaryColor: null, tertiaryColor: null }, hoist: body.hoist, mentionable: body.mentionable, managed: false }
        roles.push(role); guild.roles.cache.set(id, role); data = roleData(role)
        for (const existing of roles) sdkGuild.roles._add(roleData(existing))
      } else {
        assert.deepEqual(body.permission_overwrites, [])
        const created = { id, name: body.name, type: body.type, parentId: body.parent_id || null,
          rawPosition: Math.max(0, ...[...guild.channels.cache.values()].filter(item => item.type === body.type).map(item => item.rawPosition)) + 1,
          topic: body.topic || '', nsfw: Boolean(body.nsfw), bitrate: body.bitrate, userLimit: body.user_limit, rateLimitPerUser: body.rate_limit_per_user || 0,
          permissionOverwrites: { cache: new Map() }, permissionsFor: () => new PermissionsBitField(permitted ? 8n : 0n) }
        guild.channels.cache.set(id, created)
        data = { ...body, id, guild_id: guildId, position: created.rawPosition }
      }
      auditEntries.set(id, { action: roleCreation ? 30 : 10, executorId: sdkClient.user.id, targetId: id, reason })
      if (loseCreation) { loseCreation = false; throw new Error('fixture create response lost after mutation') }
      return data
    }
    guild.roles.create = options => sdkGuild.roles.create(options)
    guild.channels.create = options => sdkGuild.channels.create(options)
    let cancelledEdits = 0
    const cancelChannel = { ...channel, id: 'cancel_chat', name: 'before cancellation', permissionOverwrites: { cache: new Map() } }
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
      if (name !== undefined) blueprint.channels.find(target => target.id === (targetGuild === guild ? channel.id : cancelChannel.id)).name = name
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
    const creationBlueprint = await proposal()
    const template = { ...creationBlueprint.channels[0], position: 0, topic: '', parentId: null }
    creationBlueprint.roles.push({ id: 'local:member', name: 'Member', position: 1, permissions: '0', color: 0x654321, managed: false, hoist: false, mentionable: false })
    creationBlueprint.channels.push({ ...template, id: 'local:category', name: 'Community', type: 4 },
      { ...template, id: 'local:text', name: 'new-chat', parentId: 'local:category' },
      { ...template, id: 'local:voice', name: 'Voice', type: 2, parentId: 'local:category', bitrate: 64000, userLimit: 0 })
    creationBlueprint.channels[0].overwrites = [{ id: 'local:member', type: 0, allow: '1024', deny: '0' }]
    creationBlueprint.channels[0].parentId = 'local:category'
    const creationPlan = await applications.prepare(guild, actorId, creationBlueprint)
    assert.equal(creates, 0); loseCreation = true
    const creationJob = await applications.confirm(guild, actorId, creationPlan), created = await completed(creationJob.id)
    assert.equal(creates, 4); assert.equal(created.result.creates, 4); assert.equal(created.result.edits, 1); assert.equal(created.result.permissionChanges, 1)
    assert.deepEqual(created.progress, { completed: 7, total: 7 }); assert.equal(created.result.moves, 1)
    assert.equal(channel.parentId, created.result.idMap['local:category']); assert.equal(channel.rawPosition, 0)
    const movePoint = await restorePoints.get(created.result.restorePointId, guildId, actorId)
    assert.equal(movePoint.snapshot.channels.find(target => target.id === channel.id).parentId, null)
    assert.equal(channel.permissionOverwrites.cache.get(created.result.idMap['local:member']).allow.bitfield, 1024n)
    assert.equal(created.result.channelCount, 4); assert.equal(created.result.roleCount, 4)
    assert.equal(guild.channels.cache.get(created.result.idMap['local:text']).parentId, created.result.idMap['local:category'])
    assert.equal(guild.channels.cache.get(created.result.idMap['local:voice']).parentId, created.result.idMap['local:category'])
    const journal = await repository.getById(creationJob.id)
    assert.deepEqual(journal.executionIdMap, created.result.idMap); assert.equal(journal.executionSnapshot.revision, journal.executionRevision)
    assert.equal(created.executionSnapshot, undefined); assert.equal(created.executionIdMap, undefined)
    await applications.confirm(guild, actorId, creationPlan); assert.equal(creates, 4)
    assert.equal(await guardModel.countDocuments({ _id: guildId }), 0)
    const permissionBlueprint = await proposal()
    permissionBlueprint.roles.find(role => role.id === 'staff').permissions = '2048'
    permissionBlueprint.channels.find(target => target.id === channel.id).overwrites = [{ id: 'staff', type: 0, allow: '2048', deny: '0' }]
    permissionBlueprint.channels.find(target => target.id === created.result.idMap['local:voice']).overwrites = [{ id: 'staff', type: 0, allow: '1048576', deny: '0' }]
    const permissionPlan = await applications.prepare(guild, actorId, permissionBlueprint)
    assert.equal(edits, 4); assert.equal(permissionPlan.permissionChanges, 3)
    const permissionJob = await applications.confirm(guild, actorId, permissionPlan), permissionsApplied = await completed(permissionJob.id)
    assert.equal(permissionsApplied.result.permissionChanges, 3); assert.equal(permissionsApplied.result.edits, 3)
    assert.deepEqual(permissionsApplied.progress, { completed: 4, total: 4 })
    assert.equal(roles.find(role => role.id === 'staff').permissions.bitfield, 2048n)
    assert.equal(channel.permissionOverwrites.cache.get('staff').allow.bitfield, 2048n)
    assert.equal(guild.channels.cache.get(created.result.idMap['local:voice']).permissionOverwrites.cache.get('staff').allow.bitfield, 1048576n)
    const permissionPoint = await restorePoints.get(permissionsApplied.result.restorePointId, guildId, actorId)
    assert.equal(permissionPoint.snapshot.roles.find(role => role.id === 'staff').permissions, '0')
    assert.deepEqual(permissionPoint.snapshot.channels.find(target => target.id === channel.id).overwrites, [{ id: created.result.idMap['local:member'], type: 0, allow: '1024', deny: '0' }])
    await applications.confirm(guild, actorId, permissionPlan); assert.equal(edits, 7)
    const rootBlueprint = await proposal(), voiceId = created.result.idMap['local:voice']
    rootBlueprint.channels.find(target => target.id === voiceId).parentId = null
    const rootPlan = await applications.prepare(guild, actorId, rootBlueprint)
    assert.equal(edits, 7)
    const rootJob = await applications.confirm(guild, actorId, rootPlan), rooted = await completed(rootJob.id)
    assert.equal(rooted.result.moves, 1); assert.deepEqual(rooted.progress, { completed: 2, total: 2 })
    assert.equal(guild.channels.cache.get(voiceId).parentId, null)
    assert.equal(guild.channels.cache.get(voiceId).permissionOverwrites.cache.get('staff').allow.bitfield, 1048576n)
    const rootPoint = await restorePoints.get(rooted.result.restorePointId, guildId, actorId)
    assert.equal(rootPoint.snapshot.channels.find(target => target.id === voiceId).parentId, created.result.idMap['local:category'])
    await applications.confirm(guild, actorId, rootPlan); assert.equal(edits, 8)
    const orderBlueprint = await proposal(), memberRoleId = created.result.idMap['local:member'], textId = created.result.idMap['local:text']
    const staffPosition = orderBlueprint.roles.find(role => role.id === 'staff').position
    orderBlueprint.roles.find(role => role.id === 'staff').position = orderBlueprint.roles.find(role => role.id === memberRoleId).position
    orderBlueprint.roles.find(role => role.id === memberRoleId).position = staffPosition
    const chatPosition = orderBlueprint.channels.find(target => target.id === channel.id).position
    orderBlueprint.channels.find(target => target.id === channel.id).position = orderBlueprint.channels.find(target => target.id === textId).position
    orderBlueprint.channels.find(target => target.id === textId).position = chatPosition
    const orderPlan = await applications.prepare(guild, actorId, orderBlueprint)
    assert.equal(edits, 8); assert.equal(orderPlan.reorders, 4)
    const orderJob = await applications.confirm(guild, actorId, orderPlan), ordered = await completed(orderJob.id)
    assert.equal(ordered.result.reorders, 4); assert.equal(ordered.result.edits, 4); assert.equal(edits, 10)
    assert.deepEqual(ordered.progress, { completed: 3, total: 3 })
    assert.equal(roles.find(role => role.id === 'staff').position, 1); assert.equal(roles.find(role => role.id === 'bot_role').position, 11)
    assert.equal(guild.channels.cache.get(textId).rawPosition, 0); assert.equal(channel.parentId, created.result.idMap['local:category'])
    assert.equal(channel.permissionOverwrites.cache.get('staff').allow.bitfield, 2048n)
    const orderPoint = await restorePoints.get(ordered.result.restorePointId, guildId, actorId)
    assert.equal(orderPoint.snapshot.roles.find(role => role.id === 'staff').position, staffPosition)
    assert.equal(orderPoint.snapshot.channels.find(target => target.id === channel.id).position, chatPosition)
    await applications.confirm(guild, actorId, orderPlan); assert.equal(edits, 10)
    const categoryBlueprint = await proposal(), categoryId = created.result.idMap['local:category']
    for (const id of [categoryId, textId]) categoryBlueprint.channels.find(target => target.id === id).overwrites = [{ id: 'staff', type: 0, allow: '0', deny: '2048' }]
    const categoryPlan = await applications.prepare(guild, actorId, categoryBlueprint)
    assert.equal(edits, 10); assert.equal(categoryPlan.cascadedChannels, 1); assert.equal(categoryPlan.edits, 2)
    const categoryJob = await applications.confirm(guild, actorId, categoryPlan), cascaded = await completed(categoryJob.id)
    assert.equal(edits, 11); assert.equal(cascaded.result.cascadedChannels, 1); assert.deepEqual(cascaded.progress, { completed: 2, total: 2 })
    for (const id of [categoryId, textId]) assert.equal(guild.channels.cache.get(id).permissionOverwrites.cache.get('staff').deny.bitfield, 2048n)
    assert.equal(channel.permissionOverwrites.cache.get('staff').allow.bitfield, 2048n)
    assert.equal(guild.channels.cache.get(voiceId).permissionOverwrites.cache.get('staff').allow.bitfield, 1048576n)
    const categoryPoint = await restorePoints.get(cascaded.result.restorePointId, guildId, actorId)
    for (const id of [categoryId, textId]) assert.deepEqual(categoryPoint.snapshot.channels.find(target => target.id === id).overwrites, [])
    await applications.confirm(guild, actorId, categoryPlan); assert.equal(edits, 11)
    const editedBeforeFailure = edits
    const driftPlan = await applications.prepare(guild, actorId, await proposal('stale'))
    channel.topic = 'manual external change'
    await assert.rejects(applications.confirm(guild, actorId, driftPlan), error => error.code === 'revision_conflict')
    assert.equal(edits, editedBeforeFailure)
    const revoked = await applications.prepare(guild, actorId, await proposal('revoked'))
    permitted = false; const denied = await applications.confirm(guild, actorId, revoked)
    assert.equal((await failed(denied.id)).error.code, 'permission_denied'); assert.equal(edits, editedBeforeFailure)
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
    assert.equal(edits, editedBeforeFailure + 1); assert.equal(channel.name, 'uncertain')
    assert.equal((await guardModel.findById(guildId).lean()).jobId, uncertainJob.id)
    loseResponse = false
    const blockedPlan = await applications.prepare(guild, actorId, await proposal('must-not-apply'))
    const blockedJob = await applications.confirm(guild, actorId, blockedPlan)
    assert.equal((await failed(blockedJob.id)).error.code, 'application_needs_review'); assert.equal(edits, editedBeforeFailure + 1)
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
      cancellationDuringRESTKeepsDurableGuard: true, actualSDKCreationSerialization: true, orderedRoleCategoryTextVoiceCreation: true,
      durableLogicalToRealIdMap: true, lostCreationResponseReconciledWithoutReplay: true, confirmedRoleTextVoicePermissions: true,
      actualSDKPermissionSerialization: true, permissionRestorePointAndCheckpoints: true, overwriteTargetUsesCreatedRoleRealId: true,
      moveUsesCreatedCategoryRealId: true, actualSDKMoveWithoutSyncOrReorder: true, moveRestorePointAndCheckpoints: true,
      voiceMoveToRootKeepsOverwrites: true, roleChannelOrderBatches: true, protectedPositionAndOverwritePreserved: true,
      reorderRestorePointAndCheckpoints: true, reviewedCategoryCascade: true, actualSDKCategoryPermissionSerialization: true,
      customChildPermissionsPreserved: true, categoryRestorePointAndCheckpoint: true }
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
