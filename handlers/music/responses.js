// Respuestas bonitas estilo Soundy para los comandos de música (prefix y slash).
const { EmbedBuilder } = require('discord.js')
const { config } = require('./config')

const E  = config.emoji
const OK = config.color.primary   // verde Soundy
const NO = 0xED4245

// Embed de acción: emoji + texto
function fx(emoji, text, color = OK) {
  return new EmbedBuilder().setColor(color).setDescription(`${emoji} ${text}`)
}
function err(text) {
  return new EmbedBuilder().setColor(NO).setDescription(`${E.no} ${text}`)
}
function voiceErrorText(client, guildId, error) {
  const { localeFor, t } = require('../i18n')
  const code = String(error?.code || '').replace(/^music_voice_/, '')
  const known = ['invalid', 'unavailable', 'access', 'actor', 'permissions', 'disabled', 'control', 'busy', 'changed', 'nodes', 'cancelled']
  return t(localeFor(client, guildId), 'music.voice.' + (known.includes(code) ? code : 'failed'))
}

module.exports = { fx, err, E, OK, NO, voiceErrorText }
