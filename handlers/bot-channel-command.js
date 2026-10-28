const { changeBotChannel } = require('./bot-channel-settings')
const { localeFor, t } = require('./i18n')
const { setupFailureNotice } = require('./setup-errors')

function channelIdFrom(args) {
  const match = String(args?.[0] || '').match(/^(?:<#(\d{17,20})>|(\d{17,20}))$/)
  return match?.[1] || match?.[2] || null
}

async function runBotChannelCommand(client, message, args, action) {
  const locale = localeFor(client, message.guild?.id)
  const notice = (key, count = 0) => ({ content: t(locale, 'botChannels.' + key, { count }),
    allowedMentions: { parse: [], repliedUser: false } })
  let reply
  try {
    const result = await changeBotChannel(client, { guildId: message.guild?.id,
      channelId: message.channel?.id, actorId: message.author?.id }, channelIdFrom(args), action)
    reply = notice(result.status, result.channels.length)
    if (!result.channels.length) reply.content += '\n' + t(locale, 'botChannels.allChannels')
    else {
      reply.content += '\n' + result.channels.slice(0, 20).map(id => `<#${id}>`).join(', ')
      if (result.channels.length > 20) reply.content += '\n' + t(locale, 'botChannels.more', { count: result.channels.length - 20 })
    }
  } catch (error) {
    const code = error.code || error.message
    const key = code === 'invalid_bot_channel' ? 'invalid' : code === 'setup_conflict' ? 'conflict' : 'unavailable'
    reply = setupFailureNotice(locale, error, notice(key), 'bot-channels/command')
  }
  try { return await message.reply(reply) }
  catch { try { return await message.author.send(reply) } catch { return undefined } }
}

module.exports = { runBotChannelCommand, channelIdFrom }
