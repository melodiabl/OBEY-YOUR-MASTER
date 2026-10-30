const { requireBotOwnerAccess } = require('./bot-owner-access')
const { localeFor, t } = require('./i18n')

async function runRetiredCommandReload(client, message, args = [], mode, options = {}) {
  const context = { guildId: message.guild?.id, channelId: message.channelId || message.channel?.id, actorId: message.author.id }
  let locale = 'es', localeUnavailable = false
  try {
    const current = localeFor(client, context.guildId)
    if (typeof current !== 'string' || current.length > 32) localeUnavailable = true
    else locale = current
  } catch { localeUnavailable = true }
  const notice = key => ({ content: t(locale, `commandReload.${key}`), allowedMentions: { parse: [], repliedUser: false } })
  let payload
  const valid = Array.isArray(args) && (mode === 'all' ? args.length === 0
    : mode === 'single' && args.length === 1 && typeof args[0] === 'string' && /^[a-z0-9][a-z0-9_-]{0,99}$/i.test(args[0]))
  if (localeUnavailable) payload = notice('unavailable')
  else {
    try {
      await requireBotOwnerAccess(client, context, options.ownerFile, { timeoutMs: options.timeoutMs ?? 10000 })
      payload = notice(valid ? 'retired' : mode === 'single' ? 'singleUsage' : 'allUsage')
    } catch (error) { payload = notice(error?.code === 'setup_denied' ? 'denied' : 'unavailable') }
  }
  try { return await message.reply(payload) } catch { return undefined }
}
module.exports = { runRetiredCommandReload }
