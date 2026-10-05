const { PermissionFlagsBits, Events } = require('discord.js')
const { JobError } = require('./jobs/service')
module.exports = client => {
  require('./jobs/config').loadJobsConfiguration()
  const storageReady = () => Boolean(client._dbReady && require('mongoose').connection.readyState === 1)
  const enabled = process.env.OBEY_JOBS_ENABLED === 'true'
  const repository = require('./jobs/repository').createJobRepository()
  client.jobRepository = repository
  const guild = record => {
    const current = client.guilds.cache.get(record.guildId)
    if (!current || current.available === false) throw new JobError('Guild unavailable', 'guild_unavailable')
    return current
  }
  client.jobs = require('./jobs/runtime').createJobsRuntime({
    repository, storageReady,
    redisUrl: enabled ? process.env.OBEY_JOBS_REDIS_URL : undefined,
    authorize: async record => {
      const actor = await guild(record).members.fetch({ user: record.actorId, force: true })
      if (!actor.permissions.has(PermissionFlagsBits.ManageGuild)) throw new JobError('Permission denied', 'permission_denied')
      if (record.type === 'architect.apply' && !client.architectApplications?.available(guild(record))) throw new JobError('Application unavailable', 'apply_unavailable')
    },
    prepareApply: async input => {
      if (!client.architectApplications?.available(guild(input))) throw new JobError('Application unavailable', 'apply_unavailable')
      return client.architectApplications.payload(input.applicationId, input.guildId, input.actorId)
    },
    handlers: {
      'architect.snapshot': record => require('./architect/snapshot').snapshotGuild(guild(record)),
      'architect.backup': (record, lease) => client.restorePoints.create(guild(record), record.actorId, record._id, lease),
      'architect.apply': (record, lease) => client.architectEdits(guild(record), record, lease),
    },
    onError: code => console.warn('[Jobs]', code),
  })
  let retryTimer, initializing = false
  async function start() {
    if (!enabled || initializing || client._shuttingDown || !storageReady() || !client.isReady()) return
    initializing = true
    try { await client.jobs.start() }
    catch { if (!client._shuttingDown) { retryTimer = setTimeout(start, 10000); retryTimer.unref() } }
    finally { initializing = false }
  }
  client.once('dbReady', start)
  client.once(Events.ClientReady, start)
  if (client._dbReady) start()
  client.stopJobs = async () => { clearTimeout(retryTimer); await client.jobs.close() }
}
