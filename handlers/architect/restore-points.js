const { randomUUID, createHash } = require('node:crypto')
const { identifier, JobError } = require('../jobs/service')
const { snapshotGuild, structureRevision } = require('./snapshot')
const { validateBlueprint } = require('./blueprint')
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
function safeSnapshot(value, guildId) {
  if (!value || value.schemaVersion !== 1 || value.guildId !== guildId || typeof value.name !== 'string' || value.name.length > 100 ||
      typeof value.capturedAt !== 'string' || !Number.isFinite(Date.parse(value.capturedAt)) ||
      !Array.isArray(value.channels) || !Array.isArray(value.roles)) throw new JobError('Invalid restore snapshot')
  const pick = (resource, fields) => Object.fromEntries(fields.map(key => [key, resource[key]]))
  const channels = value.channels.map(resource => pick(resource, ['id', 'name', 'type', 'parentId', 'position', 'topic', 'nsfw', 'bitrate', 'userLimit', 'rateLimitPerUser', 'overwrites']))
  for (const channel of channels) if (Array.isArray(channel.overwrites)) channel.overwrites = channel.overwrites.map(overwrite => pick(overwrite, ['id', 'type', 'allow', 'deny']))
  const roles = value.roles.map(resource => pick(resource, ['id', 'name', 'position', 'permissions', 'color', 'hoist', 'mentionable', 'managed']))
  const revision = structureRevision(channels, roles)
  if (revision !== value.revision) throw new JobError('Invalid restore snapshot revision')
  validateBlueprint({ schemaVersion: 1, baseRevision: revision, channels, roles }, { guildId, revision, channels, roles })
  return { schemaVersion: 1, guildId, name: value.name, capturedAt: value.capturedAt, completeness: 'structure_only',
    scope: ['guild_channels', 'roles', 'permission_overwrites'],
    warnings: ['No incluye mensajes, miembros, hilos ni configuración de módulos OBEY.',
      'No restaura IDs eliminados, enlaces, mensajes ni recursos externos.'], channels, roles, revision }
}
function project(point, includeSnapshot = false) {
  if (!point) return null
  if (digest(point.snapshot) !== point.digest) throw new JobError('Restore point integrity failed', 'restore_point_corrupt')
  return { id: point._id, schemaVersion: point.schemaVersion, createdAt: point.createdAt, createdBy: point.actorId,
    origin: point.origin, completeness: point.snapshot.completeness, scope: point.snapshot.scope, warnings: point.snapshot.warnings,
    revision: point.snapshot.revision, capturedAt: point.snapshot.capturedAt,
    channelCount: point.snapshot.channels.length, roleCount: point.snapshot.roles.length,
    ...(includeSnapshot ? { snapshot: structuredClone(point.snapshot) } : {}) }
}
function createRestorePointService({ repository, snapshot = snapshotGuild, storageReady = () => true }) {
  const requireStorage = () => { if (!storageReady()) throw new JobError('Restore storage unavailable', 'storage_unavailable') }
  return {
    async create(guild, actorId, jobId, lease, origin = 'manual') {
      identifier(guild?.id, 'guild'); identifier(actorId, 'actor'); identifier(jobId, 'job ID'); requireStorage()
      if (!['manual', 'before_apply'].includes(origin)) throw new JobError('Invalid restore origin')
      const old = await repository.findByJob(guild.id, actorId, jobId)
      if (old) return project(old)
      const current = safeSnapshot(await snapshot(guild), guild.id)
      await lease?.assertOwned()
      const record = await repository.ensure({ _id: randomUUID(), schemaVersion: 1, guildId: guild.id, actorId, jobId,
        createdAt: new Date(), origin, snapshot: current, digest: digest(current) })
      return project(record)
    },
    async get(id, guildId, actorId) {
      identifier(id, 'restore point'); identifier(guildId, 'guild'); identifier(actorId, 'actor'); requireStorage()
      return project(await repository.get(id, guildId, actorId), true)
    },
    async list(guildId, actorId) {
      identifier(guildId, 'guild'); identifier(actorId, 'actor'); requireStorage()
      return (await repository.list(guildId, actorId)).map(point => project(point))
    },
  }
}
module.exports = { createRestorePointService, safeSnapshot }
