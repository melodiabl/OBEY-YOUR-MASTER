const { ActionRowBuilder, ButtonBuilder, ButtonStyle, escapeMarkdown } = require('discord.js')
const { randomUUID } = require('node:crypto')
const { prepareGuildLeave, confirmGuildLeave } = require('./owner-guild-leave')
const { localeFor, t } = require('./i18n')
async function runGuildLeave(client, message, args = [], options = {}) {
  const context = { guildId: message.guild?.id, channelId: message.channelId || message.channel?.id, actorId: message.author.id }
  const locale = localeFor(client, context.guildId)
  const notice = (key, variables) => ({ content: t(locale, `ownerLeave.${key}`, variables), embeds: [], components: [], allowedMentions: { parse: [], repliedUser: false } })
  const failure = error => notice(({ setup_denied: 'denied', leave_invalid: 'usage', leave_target: 'targetUnavailable', leave_conflict: 'conflict',
    leave_expired: 'expired', leave_busy: 'busy', leave_timeout: 'timeout', leave_unconfirmed: 'unconfirmed' })[error?.code] || 'unavailable')
  const reply = async payload => { try { return await message.reply(payload) } catch { return null } }
  if (args.length !== 1) return reply(notice('usage'))
  let prepared
  try { prepared = await prepareGuildLeave(client, context, args[0], options) } catch (error) { return reply(failure(error)) }
  const token = randomUUID(), ids = { confirm: `guild-leave:${token}:confirm`, cancel: `guild-leave:${token}:cancel` }
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(ids.confirm).setLabel(t(locale, 'ownerLeave.confirm')).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(ids.cancel).setLabel(t(locale, 'ownerLeave.cancel')).setStyle(ButtonStyle.Secondary))
  const prompt = await reply({ ...notice('preview', { name: escapeMarkdown(prepared.name), id: prepared.guildId }), components: [row] })
  if (!prompt) return
  let collector, finished = false, busy = false
  try { collector = prompt.createMessageComponentCollector({ time: Math.max(1, prepared.expiresAt - Date.now()),
    filter: b => b.guildId === context.guildId && b.message?.id === prompt.id && Object.values(ids).includes(b.customId) && b.isButton() }) }
  catch { await prompt.edit(notice('unavailable')).catch(() => {}); return }
  collector.on('collect', b => {
    ;(async () => {
      if (b.user.id !== context.actorId) { await b.reply({ ...notice('notYours'), ephemeral: true }).catch(() => {}); return }
      if (finished || busy) { await b.deferUpdate().catch(() => {}); return }
      busy = true
      try {
        await b.deferUpdate()
        if (finished) return
        finished = true; collector.stop('claimed')
        if (b.customId === ids.cancel) { await b.editReply(notice('cancelled')); return }
        let result
        try {
          await confirmGuildLeave(client, context, prepared, { ...options, beforeLeave: () => b.editReply(notice('requesting')) })
          result = notice('confirmed')
        } catch (error) { result = failure(error) }
        // Leaving the origin guild can make result delivery impossible; never repeat the effect.
        try { await b.editReply(result) } catch { await prompt.edit(result).catch(() => {}) }
      } catch { finished = true; collector.stop('failed'); await prompt.edit(notice('unavailable')).catch(() => {}) }
      finally { busy = false }
    })().catch(() => {})
  })
  collector.on('end', () => { if (!finished) { finished = true; prompt.edit(notice('expired')).catch(() => {}) } })
  return prompt
}
module.exports = { runGuildLeave }
