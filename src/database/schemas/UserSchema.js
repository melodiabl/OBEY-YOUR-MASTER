const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  userID: { type: String, required: true, unique: true },
  money: { type: Number, default: 0 },
  workCooldown: { type: Number, default: 0 },
  dailyCooldown: { type: Number, default: 0 },
  collection: { type: Array, default: [] }
});

module.exports = model('User', UserSchema);
