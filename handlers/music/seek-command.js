const { fx, err, E } = require('./responses')
const { fmtMs } = require('./utils')
const { localeFor, t } = require('../i18n')

function parsePosition(value) {
  if (typeof value !== 'string' || !/^\d+(?::\d{1,2}){0,2}(?:\.\d{1,3})?$/.test(value.trim())) return null
  const parts = value.trim().split(':').map(Number)
  if (parts.slice(1).some(part => part >= 60)) return null
  const ms = Math.round(parts.reduce((total, part) => total * 60 + part, 0) * 1000)
  return Number.isSafeInteger(ms) ? ms : null
}

async function runSeek(client, context, { action, input, slash = false }) {
  const guildId = context.guildId || context.guild?.id
  const locale = localeFor(client, guildId)
  const tr = (key, values) => t(locale, 'music.' + key, values)
  let waiting
  if (slash) await context.deferReply()
  else waiting = await context.reply({ content: tr('seekLoading'), allowedMentions: { parse: [] } })
  const edit = payload => slash ? context.editReply(payload) : waiting.edit(payload)
  try {
    if (!context.member?.voice?.channel) throw new Error(tr('joinVoiceSearch'))
    if (!client.music?.getState(guildId)?.currentTrack) throw new Error(tr('noCurrentTrack'))
    let result
    if (action === 'seek') {
      const position = parsePosition(input)
      if (position === null) throw new Error(tr('seekInvalid'))
      result = await client.music.seek(guildId, position)
    } else if (action === 'restart') result = await client.music.seek(guildId, 0)
    else {
      const seconds = input == null ? 10 : Number(input)
      if (!['forward', 'rewind'].includes(action) || !Number.isSafeInteger(seconds) || seconds <= 0 || !Number.isSafeInteger(seconds * 1000)) throw new Error(tr('seekSecondsInvalid'))
      result = await client.music.seekRelative(guildId, seconds * (action === 'rewind' ? -1000 : 1000))
    }
    if (!Number.isFinite(result?.positionMs)) throw new Error(tr('seekUnconfirmed'))
    const emoji = action === 'forward' ? E.forward : action === 'rewind' ? E.rewind : E.clock
    return await edit({ content: '', embeds: [fx(emoji, tr('seekPosition', { position: fmtMs(result.positionMs) }))], allowedMentions: { parse: [] } })
  } catch (error) {
    return edit({ content: '', embeds: [err(error.message || tr('seekUnconfirmed'))], allowedMentions: { parse: [] } })
  }
}

module.exports = { parsePosition, runSeek }
