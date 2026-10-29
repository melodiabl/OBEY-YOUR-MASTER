const { escapeMarkdown } = require('discord.js')
const { createGlobalPrefixSettings } = require('./global-prefix-settings')
const { prefixSchema } = require('./prefix-settings')
const { localeFor, t } = require('./i18n')
const { setupFailureNotice } = require('./setup-errors')

async function changeGlobalPrefix(client, message, args = [], options) {
  const context = { guildId: message.guild?.id, channelId: message.channelId || message.channel?.id, actorId: message.author.id }
  const locale = localeFor(client, context.guildId)
  const notice = (key, variables) => ({ content: t(locale, 'globalPrefix.' + key, variables),
    embeds: [], components: [], allowedMentions: { parse: [], repliedUser: false } })
  let response
  try {
    const service = createGlobalPrefixSettings(client, context, options), before = await service.read()
    if (!args.length) response = notice('current', { prefix: escapeMarkdown(String(before.values.prefix)) })
    else if (args.length !== 1 || !prefixSchema.safeParse(args[0]).success) response = notice('invalid')
    else {
      const saved = await service.save(null, { prefix: args[0] }, before.revision)
      response = notice('saved', { prefix: escapeMarkdown(saved.values.prefix) })
    }
  } catch (error) {
    const key = error.code === 'setup_denied' ? 'ownerOnly' : error.code === 'setup_conflict' ? 'conflict' : 'unavailable'
    response = setupFailureNotice(locale, error, notice(key), 'global-prefix/command')
  }
  // Reply failure must never run the mutation again or report that the save failed.
  return message.reply(response)
}

module.exports = { changeGlobalPrefix }
