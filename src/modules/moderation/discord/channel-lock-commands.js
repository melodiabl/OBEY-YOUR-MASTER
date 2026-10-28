const { t, localeFor } = require('../../../../handlers/i18n')
const { changeChannelLock, ChannelLockError } = require('../application/channel-lock')

async function runPrefixChannelLock(client, message, args, command) {
  const locale = localeFor(client, message.guild?.id)
  let content
  try {
    const result = await changeChannelLock(client, message, args, command)
    const key = result.applied ? result.mode + 'ed' : 'unchanged'
    content = t(locale, 'moderationChannelLock.' + key,
      { channel: `<#${result.channel.id}>`, count: result.applied })
  } catch (error) {
    const code = error instanceof ChannelLockError ? error.code : 'unavailable'
    content = t(locale, 'moderationChannelLock.' + code, { count: error.applied || 0 })
  }
  const payload = { content, allowedMentions: { parse: [], repliedUser: false } }
  try { return await message.reply(payload) }
  catch {
    try { return await message.author.send(payload) }
    catch { return undefined }
  }
}

module.exports = { runPrefixChannelLock }
