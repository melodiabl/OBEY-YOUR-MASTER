const TTLCache = require('../../core/cache/ttlCache')
const UserSchema = require('../../database/schemas/UserSchema')
const GuildSchema = require('../../database/schemas/GuildSchema')

// Anti-spam: solo da XP cada N ms por usuario/guild.
const xpCooldownCache = new TTLCache({ defaultTtlMs: 20_000, maxSize: 300_000 })

function key (guildID, userID) {
  return `${guildID}:${userID}`
}

function nextLevelXp (level) {
  const l = Number(level || 1)
  return l * l * 100
}

function randomXp (min = 5, max = 15) {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

function normalizeMap (m) {
  if (!m) return new Map()
  if (typeof m.get === 'function') return m
  return new Map(Object.entries(m))
}

async function handleMessageXp ({ client, message }) {
  if (!message?.guild || !message?.author || message.author.bot) return { applied: false }

  const guildID = message.guild.id
  const userID = message.author.id

  const guildDoc = await client.db.getGuildData(guildID).catch(() => null)
  if (guildDoc && guildDoc.levelsEnabled === false) return { applied: false }

  const k = key(guildID, userID)
  if (xpCooldownCache.get(k)) return { applied: false }
  xpCooldownCache.set(k, true, 20_000)

  const gain = randomXp()
  const user = await UserSchema.findOneAndUpdate(
    { userID },
    { $setOnInsert: { userID }, $inc: { xp: gain } },
    { upsert: true, new: true }
  )

  const needed = nextLevelXp(user.level || 1)
  if (Number(user.xp || 0) < needed) return { applied: true, leveledUp: false, gain }

  // Level up.
  const newLevel = Number(user.level || 1) + 1
  user.level = newLevel
  user.xp = 0
  await user.save()

  // Rewards: rol por nivel (opcional).
  try {
    const g = guildDoc || (await GuildSchema.findOne({ guildID }))
    const rewards = normalizeMap(g?.levelsRoleRewards)
    const roleId = rewards.get(String(newLevel))
    if (roleId) {
      const member = await message.guild.members.fetch(userID).catch(() => null)
      if (member) await member.roles.add(roleId).catch(() => {})
    }

    // Anuncio: canal configurado o canal actual.
    const announceChannelId = g?.levelsAnnounceChannel || null
    const channel = announceChannelId ? message.guild.channels.cache.get(announceChannelId) : message.channel
    if (channel?.send) {
      await channel.send(`📈 ¡Felicidades <@${userID}>! Subiste a **nivel ${newLevel}**.`).catch(() => {})
    }
  } catch (_) {}

  return { applied: true, leveledUp: true, gain, level: newLevel }
}

module.exports = {
  handleMessageXp,
  nextLevelXp
}

