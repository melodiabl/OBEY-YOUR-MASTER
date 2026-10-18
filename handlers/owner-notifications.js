const { EmbedBuilder, Events, escapeMarkdown } = require('discord.js')
const { randomUUID, createHash } = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')
const { asFooter } = require('./presentation/metadata')
const configFile = path.join(__dirname, '../botconfig/config.json')
const initialized = new WeakMap()

async function readOwnerNoticePreferences(file = configFile) {
  const stat = await fs.lstat(file)
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('owner_configuration_unavailable')
  const config = JSON.parse(await fs.readFile(file, 'utf8'))
  return { ownerIds: [...new Set((Array.isArray(config.ownerIDS) ? config.ownerIDS : []).filter(id => typeof id === 'string' && /^\d{17,20}$/.test(id)))],
    enabled: config.ownerGuildNotifications !== false, locale: config.ownerNotificationsLanguage === 'en' ? 'en' : 'es' }
}

function buildGuildNotice(kind, snapshot, locale = 'es') {
  const en = locale === 'en', joined = kind === 'joined'
  const safe = (value, limit = 900) => escapeMarkdown(String(value || (en ? 'Unavailable' : 'Sin datos'))).slice(0, limit)
  const count = value => Number.isSafeInteger(value) && value >= 0 ? String(value) : en ? 'Unavailable' : 'Sin datos'
  const embed = new EmbedBuilder().setColor(joined ? 0x57F287 : 0xED4245)
    .setTitle(en ? joined ? 'OBEY joined a server' : 'OBEY left a server' : joined ? 'OBEY se ha unido a un servidor' : 'OBEY ha salido de un servidor')
    .setDescription(safe(snapshot.name, 200))
    .addFields({ name: en ? 'Server ID' : 'ID del servidor', value: safe(snapshot.id), inline: true },
      { name: en ? 'Members' : 'Miembros', value: count(snapshot.memberCount), inline: true },
      { name: en ? 'Current servers' : 'Servidores actuales', value: count(snapshot.serverCount), inline: true },
      { name: en ? 'Server owner' : 'Propietario del servidor', value: `${safe(snapshot.ownerName)}\n${safe(snapshot.ownerId)}` })
    .setFooter(asFooter({ text: en ? 'Bot owner notifications' : 'Avisos al propietario del bot' })).setTimestamp(snapshot.observedAt || new Date())
  if (snapshot.icon) embed.setThumbnail(snapshot.icon)
  return { embeds: [embed], allowedMentions: { parse: [], repliedUser: false } }
}

function createOwnerNotifications(client, { readPreferences = readOwnerNoticePreferences, write = row => console.info(JSON.stringify(row)) } = {}) {
  const memberships = new Set(), pending = []
  let closing = false, processing = Promise.resolve(), running = false
  const listeners = []
  const counters = { sent: 0, failed: 0, dropped: 0 }
  const log = (requestId, status, code) => write({ event: 'owner_guild_notice', entryPoint: 'guild_lifecycle', requestId, status, ...(code ? { code } : {}) })
  function baseline() { memberships.clear(); for (const id of client.guilds.cache.keys()) memberships.add(id) }
  async function deliver(record) {
    let preferences
    try { preferences = await readPreferences() } catch { log(record.requestId, 'failed', 'configuration_unavailable'); counters.failed++; return }
    if (!preferences.enabled) return
    for (const id of new Set(preferences.ownerIds)) {
      if (closing || client._shuttingDown) return
      try {
        const user = await client.users.fetch(id)
        const current = await readPreferences()
        if (closing || client._shuttingDown || !current.enabled || !current.ownerIds.includes(id)) continue
        const payload = buildGuildNotice(record.kind, record.snapshot, current.locale)
        await user.send({ ...payload, nonce: createHash('sha256').update(record.requestId + id).digest('hex').slice(0, 25), enforceNonce: true })
        counters.sent++; log(record.requestId, 'sent')
      } catch (error) {
        counters.failed++
        log(record.requestId, 'failed', error?.code === 50007 ? 'dm_closed' : 'delivery_unconfirmed')
      }
    }
  }
  function kick() {
    if (running || closing || !client._dbReady || !client.isReady()) return
    running = true
    processing = (async () => {
      while (pending.length && !closing && !client._shuttingDown && client._dbReady) await deliver(pending.shift())
    })().finally(() => { running = false })
  }
  function capture(kind, guild) {
    if (closing || client._shuttingDown || !client.isReady() || !guild?.id || guild.available === false) return
    if (kind === 'joined' ? memberships.has(guild.id) : !memberships.has(guild.id)) return
    if (kind === 'joined') memberships.add(guild.id)
    else memberships.delete(guild.id)
    const requestId = randomUUID()
    if (pending.length >= 100) { counters.dropped++; log(requestId, 'dropped', 'queue_full'); return }
    const owner = guild.members?.cache?.get(guild.ownerId)?.user
    pending.push({ kind, requestId, snapshot: { id: guild.id, name: guild.name, ownerId: guild.ownerId, ownerName: owner?.globalName || owner?.username,
      memberCount: guild.memberCount, serverCount: client.guilds.cache.size, icon: guild.iconURL?.({ size: 128 }), observedAt: new Date() } })
    kick()
  }
  function on(event, listener) { client.on(event, listener); listeners.push([event, listener]) }
  on(Events.ClientReady, () => { baseline(); kick() })
  on('dbReady', kick)
  on(Events.GuildCreate, guild => capture('joined', guild))
  on(Events.GuildDelete, guild => capture('left', guild))
  if (client.isReady()) baseline()
  return {
    drain: () => processing,
    stats: () => ({ ...counters, pending: pending.length }),
    async stop() {
      closing = true
      for (const [event, listener] of listeners) client.off(event, listener)
      counters.dropped += pending.length; pending.length = 0
      await processing
    },
  }
}

function initializeOwnerNotifications(client) {
  if (initialized.has(client)) return initialized.get(client)
  const service = createOwnerNotifications(client)
  initialized.set(client, service)
  client.ownerNotifications = service
  client.stopOwnerNotifications = () => service.stop()
  return service
}

module.exports = initializeOwnerNotifications
Object.assign(module.exports, { readOwnerNoticePreferences, buildGuildNotice, createOwnerNotifications })
