const { t, localeFor } = require('../../../../handlers/i18n')
const { changeThreadMembership, joinActiveThreads, deleteThread } = require('../application/thread-actions')

function threadActionReply(locale, result) {
  const key = result?.status || 'unavailable'
  return { content: t(locale, 'moderationThreadActions.' + key, {
    thread: result?.threadId ? `<#${result.threadId}>` : '',
    joined: result?.joined ?? 0, failed: result?.failed ?? 0,
    remaining: result?.remaining ?? 0,
  }), allowedMentions: { parse: [], repliedUser: false } }
}

async function runPrefixThreadAction(client, message, args, command) {
  const locale = localeFor(client, message.guild?.id)
  let result
  try {
    result = command === 'jointhreads' ? await joinActiveThreads(client, message)
      : command === 'deletethread' ? await deleteThread(client, message, args)
        : await changeThreadMembership(client, message, args, command)
  } catch { result = { status: 'unavailable' } }
  const reply = threadActionReply(locale, result)
  try { return await message.reply(reply) }
  catch { try { return await message.author.send(reply) } catch { return undefined } }
}

module.exports = { runPrefixThreadAction, threadActionReply }
