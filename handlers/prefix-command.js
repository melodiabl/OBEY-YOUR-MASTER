const { EmbedBuilder, escapeMarkdown } = require('discord.js')
const { createPrefixSettings, prefixSchema } = require('./prefix-settings')
const { requireSetupAccess } = require('./setup-access')
const { setupFailureNotice } = require('./setup-errors')
const { localeFor, t } = require('./i18n')

async function changeGuildPrefix(client, origin, prefix, slash = false) {
  const context = { guildId: origin.guild.id, actorId: (origin.user || origin.author).id,
    channelId: origin.channelId || origin.channel?.id }
  const locale = localeFor(client, context.guildId)
  const reply = payload => slash ? origin.editReply(payload) : origin.reply(payload)
  if (slash) await origin.deferReply({ ephemeral: true })
  const notice = key => ({ content: t(locale, `setup.prefix.${key}`), embeds: [], components: [], allowedMentions: { parse: [], repliedUser: false } })
  try {
    if (!prefixSchema.safeParse(prefix).success) return reply(notice('invalid'))
    await requireSetupAccess(client, context)
    const service = createPrefixSettings(client), before = await service.read(context.guildId)
    await requireSetupAccess(client, context)
    await service.save(context.guildId, { prefix }, before.revision)
    return reply({ embeds: [new EmbedBuilder().setColor(0x22C55E).setTitle(t(locale, 'setup.prefix.saved'))
      .setDescription(t(locale, 'setup.prefix.current', { prefix: escapeMarkdown(prefix) }))],
      allowedMentions: { parse: [], repliedUser: false } })
  } catch (error) {
    const key = error.code === 'setup_conflict' ? 'conflict' : error.code === 'invalid_setup' ? 'invalid' : 'unavailable'
    return reply(setupFailureNotice(locale, error, notice(key), 'prefix/command'))
  }
}

module.exports = { changeGuildPrefix }
