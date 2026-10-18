const { CronJob } = require('cron')
const { publishRoster } = require('./roster-publication')
const { snowflake } = require('./setup-fields')
module.exports = client => {
  let running = false
  const refresh = async () => {
    if (running || client._shuttingDown || client._dbReady === false) return
    running = true
    try {
      for (const guild of client.guilds.cache.values()) {
        const numbers = Array.from({ length: 100 }, (_, index) => index + 1).filter(number => {
          const value = client.roster.get(guild.id, `roster${number}`)
          return snowflake.safeParse(value?.rosterchannel).success && snowflake.safeParse(value?.rostermessage).success
        })
        if (!numbers.length) continue
        try {
          await guild.members.fetch()
          for (const number of numbers) {
            if (client._shuttingDown) return
            await publishRoster(client, { guildId: guild.id }, number, { automatic: true, hydrate: false }).catch(() => {})
          }
        } catch { if (!client._shuttingDown) console.error('[Roster] Could not refresh guild', guild.id) }
      }
    } finally { running = false }
  }
  client.Jobroster = new CronJob('0 */30 * * * *', refresh, null, true, 'America/Los_Angeles')
  client.once('dbReady', refresh)
}
