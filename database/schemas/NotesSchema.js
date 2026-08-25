const { Schema, model } = require('mongoose')
const NotesSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  notes:  { type: Array, default: [] },
})
module.exports = model('Notes', NotesSchema)
