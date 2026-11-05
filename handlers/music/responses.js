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

async function runPlaybackControl(client, context, { action, count = 1, slash = false }) {
  const { localeFor, t } = require('../i18n')
  const guildId = context.guildId || context.guild?.id
  const tr = (key, values) => t(localeFor(client, guildId), 'music.' + key, values)
  const allowedMentions = { parse: [], repliedUser: false }
  let waiting
  if (slash) await context.deferReply()
  else waiting = await context.reply({ content: tr('controlLoading'), allowedMentions })
  const edit = payload => slash ? context.editReply(payload) : waiting.edit(payload)
  const fail = key => edit({ content: '', embeds: [err(tr(key))], allowedMentions })
  if (!client.music) return fail('voice.unavailable')
  if (!context.member?.voice?.channel) return fail('voiceRequired')
  if (action !== 'stop' && client.settings?.get?.(guildId, 'MUSIC') === false) return fail('searchDisabled')
  if (action !== 'stop' && !client.music.getState(guildId).currentTrack) return fail('noCurrentTrack')
  try {
    let key, emoji
    if (action === 'pause' || action === 'resume') {
      const paused = action === 'pause'
      if (await client.music.pause(guildId, paused) !== paused) throw Error('control_unconfirmed')
      key = paused ? 'controlPaused' : 'controlResumed'; emoji = paused ? E.pause : E.play
    } else if (action === 'skip') {
      if (!Number.isSafeInteger(count) || count < 1 || count > client.music.getState(guildId).queue.length + 1) return fail('controlSkipInvalid')
      if (await client.music.skip(guildId, count) !== true) throw Error('control_unconfirmed')
      key = count === 1 ? 'controlSkipped' : 'controlSkippedMany'; emoji = E.skip
    } else if (action === 'stop') {
      const result = await client.music.stop(guildId)
      if (result?.stopped !== true) throw Error('control_unconfirmed')
      key = result.persisted === false ? 'controlStopPending' : 'controlStopped'; emoji = E.stop
    } else throw Error('invalid_control')
    return await edit({ content: '', embeds: [fx(emoji, tr(key, { count }))], allowedMentions })
  } catch (error) {
    return fail(error.code === 'music_playback_cancelled' ? 'controlCancelled' : 'controlFailed')
  }
}

module.exports = { fx, err, E, OK, NO, voiceErrorText, runPlaybackControl }
