const { escapeMarkdown } = require('discord.js')
const { performBotProfileChange } = require('./bot-profile-service')
const { MAX_IMAGE_BYTES } = require('./card-media')
const { localeFor, t } = require('./i18n')
const fail = () => { throw Object.assign(new Error('profile_avatar'), { code: 'profile_avatar' }) }
function avatarSource(message, args) {
  const attachments = [...(message.attachments?.values?.() || [])]
  if (attachments.length) {
    if (attachments.length !== 1 || args.length) fail()
    const image = attachments[0]
    if (image.size !== undefined && (!Number.isSafeInteger(image.size) || image.size <= 0 || image.size > MAX_IMAGE_BYTES)) fail()
    if (image.contentType && !['image/png', 'image/jpeg', 'image/gif'].includes(image.contentType)) fail()
    return image.url
  }
  if (args.length !== 1) fail()
  return args[0]
}
async function runBotProfileCommand(client, message, args = [], kind, options) {
  const context = { guildId: message.guild?.id, channelId: message.channelId || message.channel?.id, actorId: message.author.id }
  const locale = localeFor(client, context.guildId)
  const notice = (key, variables) => ({ content: t(locale, `botProfile.${key}`, variables), embeds: [], components: [], allowedMentions: { parse: [], repliedUser: false } })
  // A failed initial response must not admit a global identity change.
  let progress
  try { progress = await message.reply(notice('checking')) } catch { return }
  let response
  try {
    const value = kind === 'name' ? args.join(' ') : avatarSource(message, args)
    const result = await performBotProfileChange(client, context, { kind, value }, options)
    response = notice(kind === 'name' ? 'savedName' : 'savedAvatar', kind === 'name' ? { name: escapeMarkdown(result.value) } : {})
  } catch (error) {
    const key = ({ profile_name: 'invalidName', profile_avatar: 'invalidAvatar', profile_busy: 'busy', profile_timeout: 'timeout',
      profile_rate_limited: 'rateLimited', setup_denied: 'denied', setup_unavailable: 'unavailable' })[error.code] || 'unconfirmed'
    response = notice(key)
  }
  // Delivery retries repeat only the result message, never the profile operation.
  try { return await progress.edit(response) } catch { try { return await message.reply(response) } catch { return } }
}
module.exports = { runBotProfileCommand, avatarSource }
