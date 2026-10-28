const { t, localeFor } = require('../../../../handlers/i18n')
const { changeThreadSettings } = require('../application/thread-settings')

function threadSettingsReply(locale, result) {
  const key = result?.status === 'changed' ? result.command : result?.status || 'unavailable'
  return { content: t(locale, 'moderationThreadSettings.' + key,
    { thread: result?.threadId ? `<#${result.threadId}>` : '', minutes: result?.value ?? 0 }),
  allowedMentions: { parse: [], repliedUser: false } }
}

async function runPrefixThreadSettings(client, message, args, command) {
  const locale = localeFor(client, message.guild?.id)
  let result
  try { result = await changeThreadSettings(client, message, args, command) }
  catch { result = { status: 'unavailable' } }
  const reply = threadSettingsReply(locale, result)
  try { return await message.reply(reply) }
  catch { try { return await message.author.send(reply) } catch { return undefined } }
}

module.exports = { runPrefixThreadSettings, threadSettingsReply }
