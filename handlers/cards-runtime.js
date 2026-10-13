const { cardPool } = require('./card-pool')
const { createCardAssets, bindCardAssets } = require('./card-assets')
const { Events } = require('discord.js')
const initialized = new WeakSet()
module.exports = client => {
  if (initialized.has(client)) return client.cards
  client.cards = cardPool()
  let cleanupTimer, cleanupRunning = false
  if (client.settings) {
    client.cardAssets ||= createCardAssets(require('../database/schemas/CardAssetsSchema'))
    bindCardAssets(client.settings, client.cardAssets)
    const cleanup = async () => {
      if (cleanupRunning || client._shuttingDown || !client._dbReady) return
      cleanupRunning = true
      try {
        if (client.isReady?.()) await client.cardAssets.maintain([...client.guilds.cache.keys()])
        await client.cardAssets.cleanup()
      } catch { console.warn('[Cards] Asset cleanup unavailable') }
      finally { cleanupRunning = false }
    }
    cleanupTimer = setInterval(cleanup, 3600000); cleanupTimer.unref()
    client.once?.('dbReady', cleanup)
    client.once?.(Events.ClientReady, cleanup)
    client.on?.('guildDelete', guild => {
      if (guild.unavailable || client._shuttingDown) return
      client.cardAssets.purgeGuild(guild.id).catch(() => console.warn('[Cards] Guild asset cleanup unavailable'))
    })
  }
  client.stopCards = () => { clearInterval(cleanupTimer); return client.cards.close() }
  initialized.add(client)
  return client.cards
}
