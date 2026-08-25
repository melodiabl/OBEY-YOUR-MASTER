const { EmbedBuilder } = require('discord.js')
const Birthday = require(`${process.cwd()}/database/schemas/BirthdaySchema`)
const Guild    = require(`${process.cwd()}/database/schemas/GuildSchema`)

async function announceBirthdays(client) {
  const now   = new Date()
  const day   = now.getDate()
  const month = now.getMonth() + 1

  const birthdays = await Birthday.find({ day, month }).lean()
  if (!birthdays.length) return

  // Agrupar por guild
  const byGuild = {}
  for (const b of birthdays) {
    if (!byGuild[b.guildId]) byGuild[b.guildId] = []
    byGuild[b.guildId].push(b.userId)
  }

  for (const [guildId, userIds] of Object.entries(byGuild)) {
    try {
      const guild = client.guilds.cache.get(guildId)
      if (!guild) continue

      const gd = await Guild.findOne({ guildId }).lean()
      const channelId = gd?.birthdayChannel || gd?.welcomeChannel
      if (!channelId) continue

      const channel = guild.channels.cache.get(channelId)
      if (!channel?.send) continue

      const members = await Promise.all(
        userIds.map(id => guild.members.fetch(id).catch(() => null))
      )
      const valid = members.filter(Boolean)
      if (!valid.length) continue

      const mentions = valid.map(m => `${m}`).join(', ')
      const embed = new EmbedBuilder()
        .setColor(0xEB459E)
        .setTitle('🎂 ¡Hoy es un cumpleaños especial!')
        .setDescription(
          valid.length === 1
            ? `🎉 ¡Feliz cumpleaños ${mentions}! Esperamos que tengas un día increíble. 🥳`
            : `🎉 ¡Feliz cumpleaños ${mentions}! ¡Que lo pasen increíble! 🥳`
        )
        .setThumbnail(valid[0].user.displayAvatarURL({ size: 256 }))
        .setTimestamp()

      await channel.send({ content: mentions, embeds: [embed] })
    } catch {}
  }
}

function scheduleDaily(client) {
  function msUntilMidnight() {
    const now  = new Date()
    const next = new Date(now)
    next.setHours(0, 0, 5, 0) // 00:00:05
    if (next <= now) next.setDate(next.getDate() + 1)
    return next - now
  }

  function loop() {
    setTimeout(async () => {
      await announceBirthdays(client).catch(() => {})
      setInterval(() => announceBirthdays(client).catch(() => {}), 86_400_000)
    }, msUntilMidnight())
  }

  loop()
  console.log('[Birthday] Scheduler activo — próxima ejecución a medianoche.'.cyan || '[Birthday] Scheduler activo')
}

module.exports = client => scheduleDaily(client)
