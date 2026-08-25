const { Schema, model } = require('mongoose')
const base = () => new Schema({ guildId: { type: String, required: true, unique: true } }, { strict: false })
const JTC1 = model('JTC1', base(), 'jtcsettings')
const JTC2 = model('JTC2', base(), 'jtcsettings2')
const JTC3 = model('JTC3', base(), 'jtcsettings3')
module.exports = { JTC1, JTC2, JTC3 }
