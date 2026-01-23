const formatter = require('../../utils/formatter')
const emojis = require('../../utils/emojis')
const UserSchema = require('../../database/schemas/UserSchema')

class AfkService {
  async setAfk(userID, reason = 'AFK') {
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

  async removeAfk(userID) {
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

  async checkAfk(message) {
    // Si el autor estaba AFK, quitarlo
    const wasAfk = await this.removeAfk(message.author.id)
    if (wasAfk) {
      message.reply(`${emojis.success} ${formatter.toBold('BIENVENIDO DE NUEVO')}, he quitado tu estado AFK.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000))
    }

    // Si alguien menciona a un usuario AFK, avisar
    if (message.mentions.users.size > 0) {
      for (const [id, user] of message.mentions.users) {
        if (user.bot) continue
        const userData = await UserSchema.findOne({ userID: id })
        if (userData?.afk?.status) {
          message.reply({
            content: `${emojis.warn} ${formatter.toBold(user.tag)} está AFK: ${formatter.italic(userData.afk.reason)} (<t:${Math.floor(userData.afk.since / 1000)}:R>)`,
            allowedMentions: { repliedUser: false }
          })
        }
      }
    }
  }
}

module.exports = new AfkService()
