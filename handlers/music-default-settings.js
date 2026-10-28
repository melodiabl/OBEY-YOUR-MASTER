const { z } = require('zod')
const { PermissionFlagsBits: F } = require('discord.js')
const { createSetupSettings } = require('./setup-settings')
const { requireSetupAccess } = require('./setup-access')

const schema = z.strictObject({ volume: z.number().int().min(0).max(200), autoplay: z.boolean() })
function fail(code) { throw Object.assign(new Error(code), { code }) }
function createMusicDefaultSettings(client) {
  return createSetupSettings(client.settings, {
    volume: { path: 'defaultVolume', default: 100, schema: schema.shape.volume },
    autoplay: { path: 'autoplay', default: false, schema: schema.shape.autoplay },
  }, () => Boolean(client._shuttingDown || client._dbReady === false))
}
async function loadMusicDefaults(client, guildId) {
  const snapshot = await createMusicDefaultSettings(client).read(guildId)
  if (!schema.safeParse(snapshot.values).success) fail('setup_storage')
  return snapshot
}
function musicDefaultsForConnection(client, guildId) {
  const values = {
    volume: client.settings?.get?.(guildId, 'defaultVolume') ?? 100,
    autoplay: client.settings?.get?.(guildId, 'autoplay') ?? false,
  }
  if (!schema.safeParse(values).success) fail('setup_storage')
  return values
}
async function authorize(client, context) {
  if (client._shuttingDown || client._dbReady === false) fail('setup_unavailable')
  if (context.transport === 'prefix') return requireSetupAccess(client, context)
  if (context.transport !== 'web') fail('setup_denied')
  const guild = client.guilds?.cache?.get(context.guildId)
  if (!guild || guild.available === false) fail('setup_denied')
  const actor = await guild.members.fetch({ user: context.actorId, force: true })
  if (actor?.id !== context.actorId || actor.guild?.id !== guild.id || !actor.permissions.has(F.ManageGuild)) fail('setup_denied')
  if (client._shuttingDown || client._dbReady === false) fail('setup_unavailable')
}
async function readMusicDefaults(client, context) {
  await authorize(client, context)
  const snapshot = await loadMusicDefaults(client, context.guildId)
  await authorize(client, context)
  return snapshot
}
async function saveMusicDefaults(client, context, patch, revision) {
  const parsed = schema.partial().safeParse(patch)
  if (!parsed.success || !Object.keys(parsed.data).length || Object.values(parsed.data).some(value => value === undefined)) fail('invalid_setup')
  if (context.transport === 'prefix' && parsed.data.volume !== undefined && (parsed.data.volume < 1 || parsed.data.volume > 150)) fail('invalid_setup')
  await authorize(client, context)
  return createMusicDefaultSettings(client).save(context.guildId, parsed.data, revision)
}
async function changeMusicDefault(client, context, field, value) {
  if (!['volume', 'autoplay'].includes(field)) fail('invalid_setup')
  const before = await readMusicDefaults(client, context)
  const next = field === 'autoplay' ? !before.values.autoplay : value
  return saveMusicDefaults(client, context, { [field]: next }, before.revision)
}
module.exports = { musicDefaultsForConnection, createMusicDefaultSettings, loadMusicDefaults, readMusicDefaults, saveMusicDefaults, changeMusicDefault }
