const { Schema, model } = require('mongoose')
const BackupSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  backups: { type: Array, default: [] },
})
module.exports = model('Backup', BackupSchema)
