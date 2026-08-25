const { Schema, model } = require('mongoose')

// Ajustes de guild para el motor de música v2 (motor v2 OBEY — adaptado de Soundy, tabla `guild`).
// Aislado de GuildSchema de OBEY para no interferir con el resto del bot.
const schema = new Schema({
  id:             { type: String, required: true, unique: true }, // guildId
  locale:         { type: String, default: null },
  prefix:         { type: String, default: null },
  defaultVolume:  { type: Number, default: null },
  // 24/7
  enabled247:     { type: Boolean, default: false },
  channel247Id:   { type: String, default: null },
  text247Id:      { type: String, default: null },
  // Setup (canal de peticiones de música)
  setupChannelId: { type: String, default: null },
  setupTextId:    { type: String, default: null },
  // Estado de voz
  voiceStatus:    { type: Boolean, default: true },
}, { timestamps: true })

module.exports = model('MusicGuild', schema)
