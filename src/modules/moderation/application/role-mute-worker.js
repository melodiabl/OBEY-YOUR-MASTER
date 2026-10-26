const { entries, removeRoleMute, sameEntry, withMemberMute } = require('../infrastructure/role-mute-store')
const { emitModerationLog } = require('./logging')

const working = new Set()
const keyOf = entry => [entry.guild, entry.user, entry.role, entry.timestamp].join(':')
const expired = (entry, now) => entry && Number.isSafeInteger(entry.timestamp) &&
  Number.isSafeInteger(entry.mutetime) && entry.mutetime > 0 && entry.timestamp + entry.mutetime <= now

async function reapplyRoleMute(client, member) {
  await withMemberMute(member.guild.id, member.id, async () => {
    const now = Date.now()
    for (const entry of entries(client)) {
      if (!entry || entry.guild !== member.guild.id || entry.user !== member.id || expired(entry, now)) continue
      if (!member.roles.cache.has(entry.role)) {
        try { await member.roles.add(entry.role, 'Restaurar silencio activo') }
        catch (error) { console.error('[Mute] Could not restore role:', error.message) }
      }
    }
  })
}

async function processExpiredRoleMutes(client, now = Date.now()) {
  for (const entry of entries(client)) {
    if (!expired(entry, now)) continue
    const key = keyOf(entry)
    if (working.has(key)) continue
    working.add(key)
    try {
      let notice
      await withMemberMute(entry.guild, entry.user, async () => {
        if (!entries(client).some(current => sameEntry(current, entry) && expired(current, Date.now()))) return
        const guild = client.guilds.cache.get(entry.guild)
        if (!guild) return
        let member
        try { member = await guild.members.fetch({ user: entry.user, force: true }) }
        catch (error) {
          if (error.code !== 10007) throw error
        }
        if (member?.roles.cache.has(entry.role)) {
          await member.roles.remove(entry.role, 'Silencio temporal vencido')
        }
        const removed = await removeRoleMute(client, entry)
        if (removed && member) notice = { guild, member }
      })
      if (notice) {
        void emitModerationLog(client, { guildId: entry.guild, kind: 'roleUnmuted',
          userId: entry.user, user: notice.member.user, actorId: client.user?.id, origin: 'scheduler' })
        const channel = entry.channel && await notice.guild.channels.fetch(entry.channel).catch(() => null)
        if (channel?.isTextBased?.()) await channel.send({ content: 'Silencio temporal retirado: ' + entry.user,
          allowedMentions: { parse: [] } }).catch(() => {})
      }
    } catch (error) {
      console.error('[Mute] Expiry retry pending:', error.message)
    } finally {
      working.delete(key)
    }
  }
}

module.exports = { reapplyRoleMute, processExpiredRoleMutes, expired }
