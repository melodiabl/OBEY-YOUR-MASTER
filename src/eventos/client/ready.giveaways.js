const GiveawaySchema = require('../../database/schemas/GiveawaySchema')
const { endGiveaway } = require('../../systems/giveaways/giveawayService')

module.exports = async (client) => {
  // Scheduler simple: al iniciar y cada minuto, finaliza sorteos vencidos.
  async function tick () {
    try {
      const due = await GiveawaySchema.find({ ended: false, endsAt: { $lte: new Date() } }).limit(20)
      for (const g of due) {
        const guild = client.guilds.cache.get(g.guildID)
        if (!guild) continue
        try {
          await endGiveaway({ client, guild, giveawayDoc: g })
        } catch (e) {}
      }
    } catch (e) {}
  }

  tick().catch(() => {})
  setInterval(() => tick().catch(() => {}), 60 * 1000).unref?.()
}

