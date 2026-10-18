const { randomBytes, createHash } = require('node:crypto')
const { PermissionFlagsBits: F } = require('discord.js')
const { requireSetupAccess } = require('./setup-access')
const { runSetupOperation } = require('./setup-operations')
const locks = new WeakMap()
const failure = code => Object.assign(new Error(code), { code })
const publicationMarker = port => `OBEY · ${port.label} · ${createHash('sha256').update(port.key).digest('hex').slice(0, 16)}`
function serialize(client, key, execute) {
  if (!locks.has(client)) locks.set(client, new Map())
  const queue = locks.get(client), previous = queue.get(key) || Promise.resolve(), result = previous.catch(() => {}).then(execute)
  queue.set(key, result)
  void result.then(clean, clean)
  function clean() { if (queue.get(key) === result) queue.delete(key) }
  return result
}
async function publicationAccess(client, context, channelId) {
  if (client._shuttingDown || context.isActive && !context.isActive()) throw failure('setup_unavailable')
  const actor = context.actorId ? await requireSetupAccess(client, context) : null
  const guild = client.guilds.cache.get(context.guildId)
  if (!guild || guild.available === false) throw failure('setup_unavailable')
  const [bot, channel] = await Promise.all([guild.members.fetchMe({ force: Boolean(context.actorId) }), guild.channels.fetch(channelId)])
  if (!channel || channel.guildId !== guild.id || ![0, 5].includes(channel.type) || actor && !channel.permissionsFor(actor.member)?.has(F.ViewChannel) || !channel.permissionsFor(bot)?.has([F.ViewChannel, F.SendMessages, F.EmbedLinks, F.ReadMessageHistory])) throw failure('setup_resource')
  return { guild, bot, channel, member: actor?.member }
}
async function knownMessage(channel, id, botId) {
  if (!id) return null
  const message = await channel.messages.fetch(id).catch(error => { if (error.code === 10008) return null; throw error })
  if (message && message.author.id !== botId) throw failure('setup_resource')
  return message
}
async function findPending(channel, marker, botId) {
  const recent = await channel.messages.fetch({ limit: 50 })
  const matches = [...recent.values()].filter(message => message.author.id === botId && message.embeds?.some(embed => embed.footer?.text === marker))
  if (matches.length > 1) throw failure('publication_uncertain')
  return matches[0] || null
}
function publishSavedMessage(client, context, port, { automatic = false, recreateMissing = false } = {}) {
  return runSetupOperation(client, () => serialize(client, `${context.guildId}:${port.key}`, async () => {
    let value = await port.read()
    if (automatic && (!value.messageId || !value.channelId || value.channelId === 'notvalid')) return null
    const access = await publicationAccess(client, context, value.channelId), marker = publicationMarker(port)
    await port.validate?.(access, value)
    let message = await knownMessage(access.channel, value.messageId, client.user.id)
    // A scheduled refresh never creates a replacement resource.
    if (automatic && !message && !recreateMissing) return null
    if (!message && value.nonce) message = await findPending(access.channel, marker, client.user.id)
    if (!message && value.nonce) throw failure('publication_uncertain')
    const payload = await port.payload(access, value, message)
    payload.allowedMentions = { parse: [], repliedUser: false }
    payload.embeds?.[0]?.setFooter({ text: marker })
    await publicationAccess(client, context, value.channelId)
    const latest = await port.read()
    if (latest.revision !== value.revision) throw failure('setup_conflict')
    if (message) {
      await message.edit(payload)
    } else {
      const nonce = randomBytes(12).toString('hex')
      value = await port.save(value, { nonce })
      if (client._shuttingDown || context.isActive && !context.isActive()) { await port.save(value, { nonce: '' }); throw failure('setup_unavailable') }
      try { message = await access.channel.send({ ...payload, nonce, enforceNonce: true }) }
      catch (error) {
        if ([400, 401, 403, 404, 413].includes(error.status)) { await port.save(value, { nonce: '' }); throw error }
        throw failure('publication_uncertain')
      }
    }
    value = await port.save(value, { messageId: message.id, nonce: '' })
    await port.after?.(access, value, message)
    return message
  }))
}
function retireSavedMessage(client, context, port) {
  return runSetupOperation(client, () => serialize(client, `${context.guildId}:${port.key}`, async () => {
    let value = await port.read()
    const access = await publicationAccess(client, context, value.channelId)
    let message = await knownMessage(access.channel, value.messageId, client.user.id)
    if (!message && value.nonce) message = await findPending(access.channel, publicationMarker(port), client.user.id)
    if (!message && value.nonce) throw failure('publication_uncertain')
    await publicationAccess(client, context, value.channelId)
    if (message) await message.delete()
    await port.save(value, { messageId: '', nonce: '' })
  }))
}
module.exports = { publishSavedMessage, retireSavedMessage, publicationAccess, serialize }
