const { GiveawaysManager } = require('discord-giveaways')
const GiveawayModel = require('../database/schemas/GiveawaySchema')

class MongoGiveaways extends GiveawaysManager {
  async getAllGiveaways() {
    return GiveawayModel.find().lean().exec()
  }
  async saveGiveaway(messageId, data) {
    await GiveawayModel.create(data)
    return true
  }
  async editGiveaway(messageId, data) {
    await GiveawayModel.updateOne({ messageId }, data, { upsert: true }).exec()
    return true
  }
  async deleteGiveaway(messageId) {
    await GiveawayModel.deleteOne({ messageId }).exec()
    return true
  }
}

module.exports = client => {
  client.giveawaysManager = new MongoGiveaways(client, {
    default: {
      botsCanWin: false,
      embedColor: '#FF4500',
      embedColorEnd: '#7289DA',
      reaction: '🎉',
    },
  })
  console.log('[Giveaway] GiveawaysManager iniciado'.green)
}
