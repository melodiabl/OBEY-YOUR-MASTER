const { Collection } = require('discord.js')
const User = require('../database/schemas/UserSchema')
const Guild = require('../database/schemas/GuildSchema')

// guildId → Map<code, { uses, inviterId }>
const inviteCache = new Collection()

async function cacheGuild(guild) {
  if (!guild.members.me.permissions.has('ManageGuild')) return
  const invites = await guild.invites.fetch().catch(() => new Collection())
  const map = new Collection()
  invites.forEach(inv => map.set(inv.code, { uses: inv.uses || 0, inviterId: inv.inviter?.id }))
  if (guild.vanityURLCode) {
    const vanity = await guild.fetchVanityData().catch(() => null)
    if (vanity) map.set(guild.vanityURLCode, { uses: vanity.uses || 0, inviterId: 'VANITY' })
  }
  inviteCache.set(guild.id, map)
  return map
}

module.exports = client => {
  client.inviteCache = inviteCache
  client.cacheGuildInvites = cacheGuild

  // Cache all guilds on ready
  client.on('ready', async () => {
    for (const guild of client.guilds.cache.values()) {
      await cacheGuild(guild).catch(() => {})
    }
  })

  client.on('guildCreate', guild => cacheGuild(guild).catch(() => {}))

  client.on('inviteCreate', invite => {
    const cache = inviteCache.get(invite.guild.id) || new Collection()
    cache.set(invite.code, { uses: invite.uses || 0, inviterId: invite.inviter?.id })
    inviteCache.set(invite.guild.id, cache)
  })

  client.on('inviteDelete', invite => {
    inviteCache.get(invite.guild.id)?.delete(invite.code)
  })

  client.on('guildMemberAdd', async member => {
    if (member.user.bot) return
    const { guild } = member
    const cached = inviteCache.get(guild.id) || new Collection()
    const fresh = await cacheGuild(guild).catch(() => new Collection())

    let usedCode = null
    let inviterId = null

    for (const [code, data] of fresh) {
      const prev = cached.get(code)
      if (!prev) continue
      if (data.uses > prev.uses) {
        usedCode = code
        inviterId = data.inviterId
        break
      }
    }

    // Update inviter stats
    if (inviterId && inviterId !== 'VANITY') {
      await User.findOneAndUpdate(
        { userId: inviterId, guildId: guild.id },
        { $inc: { invites: 1 }, $setOnInsert: { userId: inviterId, guildId: guild.id } },
        { upsert: true }
      ).catch(() => {})
    }

    // Save who invited the new member
    if (inviterId) {
      await User.findOneAndUpdate(
        { userId: member.id, guildId: guild.id },
        { invitedBy: inviterId, $setOnInsert: { userId: member.id, guildId: guild.id } },
        { upsert: true }
      ).catch(() => {})
    }
  })

  client.on('guildMemberRemove', async member => {
    if (member.user.bot) return
    const userData = await User.findOne({ userId: member.id, guildId: member.guild.id }).catch(() => null)
    if (userData?.invitedBy && userData.invitedBy !== 'VANITY') {
      await User.findOneAndUpdate(
        { userId: userData.invitedBy, guildId: member.guild.id },
        { $inc: { invites: -1, leftInvites: 1 } }
      ).catch(() => {})
    }
  })

  console.log('[InviteTracking] Handler iniciado'.green)
}
