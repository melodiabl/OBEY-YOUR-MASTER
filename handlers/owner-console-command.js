const { requireBotOwnerAccess } = require('./bot-owner-access')
const { localeFor, t } = require('./i18n')

async function runOwnerConsoleNotice(client, message, options = {}) {
  const context = { guildId: message.guild?.id, channelId: message.channelId || message.channel?.id, actorId: message.author.id }
  let locale = 'es', localeUnavailable = false
  try {
    const current = localeFor(client, context.guildId)
    if (typeof current !== 'string' || current.length > 32 || !/^(?:es|en|de|in)(?:[-_][a-z0-9]{2,8})*$/i.test(current)) localeUnavailable = true
    else locale = current
  } catch { localeUnavailable = true }
  const notice = key => ({ content: t(locale, `ownerConsole.${key}`), allowedMentions: { parse: [], repliedUser: false } })
  let payload
  if (localeUnavailable) payload = notice('unavailable')
  else {
    try {
      await requireBotOwnerAccess(client, context, options.ownerFile, { timeoutMs: options.timeoutMs ?? 10000 })
      payload = notice('retired')
    } catch (error) { payload = notice(error?.code === 'setup_denied' ? 'denied' : 'unavailable') }
  }
  try { return await message.reply(payload) } catch { return undefined }
}
module.exports = { runOwnerConsoleNotice }
