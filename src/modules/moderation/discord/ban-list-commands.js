const { EmbedBuilder, escapeMarkdown } = require('discord.js')
const { t, localeFor } = require('../../../../handlers/i18n')
const { indexFor, HistoryError } = require('../domain/warnings')
const { historyRequest } = require('../application/history')
const { readBanList } = require('../application/ban-list')

const safe = (value, limit) => escapeMarkdown(String(value ?? '').slice(0, limit).replace(/[\u0000-\u001f\u007f]/g, ' ')).slice(0, limit).toWellFormed()

function banListPayload(locale, guild, { rows, total, page, pages }) {
  const lines = rows.map(ban => {
    const name = safe(ban.user.username || ban.user.id, 80)
    const reason = safe(ban.reason, 256) || t(locale, 'moderationBanList.noReason')
    return `**${name}** · \`${ban.user.id}\`\n${t(locale, 'moderationBanList.reason')}: ${reason}`
  })
  const embed = new EmbedBuilder().setColor(0xF0B232)
    .setTitle(t(locale, 'moderationBanList.title', { server: safe(guild.name, 80) }).slice(0, 256))
    .setDescription(lines.join('\n\n') || t(locale, 'moderationBanList.empty'))
    .setFooter({ text: t(locale, 'moderationBanList.page', { page, pages, total }) })
  return { embeds: [embed], allowedMentions: { parse: [], repliedUser: false } }
}

async function runPrefixBanList(client, message, args, command) {
  const locale = localeFor(client, message.guild.id)
  let notice = 'sent'
  try {
    if (!['bans', 'listbans'].includes(command)) throw new HistoryError('accessDenied')
    const requested = indexFor(args[0])
    await historyRequest(client, async context => {
      const result = await readBanList(client, message.guild, message.author.id, requested, context)
      const payload = banListPayload(locale, message.guild, result)
      context.check()
      try { await message.author.send(payload) } catch { throw new HistoryError('deliveryUnconfirmed') }
    })
  } catch (error) { notice = error instanceof HistoryError ? error.code : 'unavailable' }
  return message.reply({ content: t(locale, 'moderationBanList.' + notice), allowedMentions: { parse: [], repliedUser: false } })
}

module.exports = { runPrefixBanList, banListPayload }
