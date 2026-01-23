const UserSchema = require('../../database/schemas/UserSchema')
const Format = require('../../utils/formatter')
const { replyInfo, replyOk } = require('../../core/ui/messageKit')

class AfkService {
  async setAfk (userID, reason = 'AFK') {
    await UserSchema.findOneAndUpdate(
      { userID },
      {
        $set: {
          'afk.status': true,
          'afk.reason': reason,
          'afk.since': Date.now()
        }
      },
      { upsert: true }
    )
  }

  async removeAfk (userID) {
    const user = await UserSchema.findOne({ userID })
    if (user?.afk?.status) {
      await UserSchema.findOneAndUpdate(
        { userID },
        { $set: { 'afk.status': false } }
      )
      return true
    }
    return false
  }

  async checkAfk (message) {
    // Si el autor estaba AFK, quitarlo
    const wasAfk = await this.removeAfk(message.author.id)
    if (wasAfk) {
      const sent = await replyOk(message.client, message, {
        system: 'notifications',
        title: 'Bienvenido de nuevo',
        lines: ['Quité tu estado AFK.'],
        signature: 'Listo'
      })
      if (sent) setTimeout(() => sent.delete().catch(() => {}), 5000)
    }

    // Si alguien menciona a un usuario AFK, avisar
    if (message.mentions.users.size > 0) {
      for (const [id, user] of message.mentions.users) {
        if (user.bot) continue
        const userData = await UserSchema.findOne({ userID: id })
        if (userData?.afk?.status) {
          const sent = await replyInfo(message.client, message, {
            system: 'notifications',
            title: 'AFK',
            lines: [
              `${Format.bold(user.tag)} está AFK.`,
              `${Format.quote(userData.afk.reason)}`,
              `Desde: <t:${Math.floor(userData.afk.since / 1000)}:R>`
            ]
          })
          if (sent) setTimeout(() => sent.delete().catch(() => {}), 10_000)
        }
      }
    }
  }
}

module.exports = new AfkService()
