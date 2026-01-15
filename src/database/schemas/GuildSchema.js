const { Schema, model } = require('mongoose')

const GuildSchema = new Schema({
  guildID: String,
  prefix: {
    type: String,
    default: process.env.PREFIX
  },
  language: {
    type: String,
    default: process.env.LANGUAGE
  },
  aiChannel: {
    type: String,
    default: null
  },
  autoRole: {
    type: String,
    default: null
  },
  suggestionChannel: {
    type: String,
    default: null
  },
  logsChannel: {
    type: String,
    default: null
  }
})

module.exports = model('ConfigServer', GuildSchema)
