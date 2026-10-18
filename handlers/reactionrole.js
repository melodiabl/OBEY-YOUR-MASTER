const { PermissionFlagsBits: F, Events } = require('discord.js')
const obeyUi = require('./assets/system')
const { runSetupOperation } = require('./setup-operations')
const { serialize } = require('./setup-publications')
const emojiKey = emoji => emoji?.id || emoji?.name
const selections = new WeakMap()
const matches = (emoji, value) => obeyUi.matchesReaction(emoji, value)
async function applyReactionRole(client, reaction, user, adding) {
  if (user?.bot || !user?.id || client._shuttingDown || client._dbReady === false || !reaction.message?.guild) return
  const guild = reaction.message.guild
  const configured = client.reactionrole.get(guild.id, 'reactionroles')
  if (!Array.isArray(configured) || !configured.some(entry => entry.MESSAGE_ID === reaction.message.id && entry.Parameters?.some(pair => matches(reaction.emoji, pair.Emoji)))) return
  if (!selections.has(client)) selections.set(client, new Map())
  const pending = selections.get(client), selectionKey = `${guild.id}:${reaction.message.id}:${user.id}`, token = { emoji: emojiKey(reaction.emoji) }
  if (adding) pending.set(selectionKey, token)
  else if (pending.has(selectionKey) && matches(reaction.emoji, pending.get(selectionKey).emoji)) pending.delete(selectionKey)
  const current = () => !adding || pending.get(selectionKey) === token
  try { return await runSetupOperation(client, () => serialize(client, `${guild.id}:reaction-member:${user.id}`, async () => {
    if (client._shuttingDown || !current()) return
    if (reaction.partial) await reaction.fetch()
    const message = reaction.message
    if (message.partial) await message.fetch()
    const [member, bot] = await Promise.all([guild.members.fetch({ user: user.id, force: true }), guild.members.fetchMe()])
    if (!member || member.guild.id !== guild.id || !bot.permissions.has(F.ManageRoles) || client._shuttingDown || !current()) return
    // Settings may have changed while member data was being fetched.
    const entry = (client.reactionrole.get(guild.id, 'reactionroles') || []).find(entry => entry.MESSAGE_ID === message.id)
    const pair = entry?.Parameters?.find(pair => matches(reaction.emoji, pair.Emoji))
    if (!pair || !/^\d{17,20}$/.test(pair.Role)) return
    const role = await guild.roles.fetch(pair.Role)
    if (!current() || !role || role.managed || role.id === guild.id || role.comparePositionTo(bot.roles.highest) >= 0) return
    if (adding) {
      if (role.permissions.has(F.Administrator)) return
      if (!member.roles.cache.has(role.id)) await member.roles.add(role.id)
      if (!entry.remove_others || !current()) return
      for (const id of new Set(entry.Parameters.map(pair => pair.Role))) {
        if (!current()) return
        if (id === role.id || !member.roles.cache.has(id)) continue
        const other = await guild.roles.fetch(id).catch(error => { if (error.code === 10011) return null; throw error })
        if (other && !other.managed && other.id !== guild.id && other.comparePositionTo(bot.roles.highest) < 0) await member.roles.remove(other.id)
      }
      if (message.channel.permissionsFor(bot)?.has(F.ManageMessages)) for (const other of message.reactions.cache.values()) {
        if (!current()) return
        if (other.users.cache.has(user.id) && !matches(other.emoji, emojiKey(reaction.emoji)) && entry.Parameters.some(pair => matches(other.emoji, pair.Emoji))) await other.users.remove(user.id)
      }
    } else {
      // Removing another emoji for the same role must not undo the current choice.
      const stillSelected = [...message.reactions.cache.values()].some(other => !matches(other.emoji, emojiKey(reaction.emoji)) && other.users.cache.has(user.id) && entry.Parameters.some(pair => pair.Role === role.id && matches(other.emoji, pair.Emoji)))
      if (!stillSelected && member.roles.cache.has(role.id)) await member.roles.remove(role.id)
    }
  })) } finally { if (adding && pending.get(selectionKey) === token) pending.delete(selectionKey) }
}
module.exports = client => {
  for (const [event, adding] of [[Events.MessageReactionAdd, true], [Events.MessageReactionRemove, false]]) client.on(event, (reaction, user) =>
    applyReactionRole(client, reaction, user, adding).catch(error => {
      if (!client._shuttingDown) console.error('[Reaction roles] Action failed:', Number.isInteger(error.code) ? error.code : 'unavailable')
    }))
}
module.exports.applyReactionRole = applyReactionRole
