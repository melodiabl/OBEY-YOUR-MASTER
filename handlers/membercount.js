const { CronJob } = require('cron')
const { updateMemberCounter } = require('./member-counter-settings')
const { snowflake } = require('./setup-fields')
module.exports = client => {
  let running = false
  const refresh = async () => {
    if (running || client._shuttingDown || client._dbReady === false) return
    running = true
    try {
      for (const guild of client.guilds.cache.values()) {
        const numbers = Array.from({ length: 25 }, (_, index) => index + 1).filter(number => snowflake.safeParse(client.setups.get(guild.id, `membercount.channel${number}`)).success)
        if (!numbers.length) continue
        try {
          await guild.members.fetch()
          for (const number of numbers) {
            if (client._shuttingDown) return
            await updateMemberCounter(client, { guildId: guild.id }, number, { hydrate: false }).catch(() => {})
          }
        } catch { if (!client._shuttingDown) console.error('[Member counter] Could not refresh guild', guild.id) }
      }
    } finally { running = false }
  }
  client.Jobmembercount = new CronJob('0 0 * * * *', refresh, null, true, 'America/Los_Angeles')
  client.once('dbReady', refresh)
}
