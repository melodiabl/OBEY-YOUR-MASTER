const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])
const { connect } = require('mongoose')
const GuildSchema = require('./schemas/GuildSchema')
const UserSchema = require('./schemas/UserSchema')
module.exports = class Database {
  connect () {
    console.log('Conectando a la base de datos'.yellow)

    connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }).then(() => {
      console.log('Conectado a la base de datos de MongoDB'.blue)
    }).catch((err) => {
      console.log('☁ ERROR AL CONECTAR A LA BASE DE DATOS DE MONGODB'.bgRed)
      console.log(err)
    })
  }

  async getGuildData (guildID) {
    let guildData = await GuildSchema.findOne({ guildID })

    if (!guildData) {
      guildData = new GuildSchema({
        guildID
      })
      await guildData.save().catch((e) => console.log(e))
    }
    return guildData
  }

  async getUserData (userID) {
    let userData = await UserSchema.findOne({ userID })

    if (!userData) {
      userData = new UserSchema({
        userID
      })
      await userData.save().catch((e) => console.log(e))
    }
    return userData
  }
}
