const { randomUUID } = require('node:crypto')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, escapeMarkdown } = require('discord.js')
const { prepareLegacyReset, confirmLegacyReset } = require('./legacy-reset-settings')
const { setupFailureNotice } = require('./setup-errors')
const { localeFor, t } = require('./i18n')
async function runLegacyReset(client, message, args = []) {
  const locale = localeFor(client, message.guild?.id)
  const context = { guildId: message.guild?.id, channelId: message.channel?.id, actorId: message.author.id }
  const notice = (key, prefix = '') => ({ content: t(locale, 'legacyReset.' + key, { prefix: escapeMarkdown(prefix) }),
    embeds: [], components: [], allowedMentions: { parse: [], repliedUser: false } })
  const failure = error => {
    const code = error.code || error.message
    const key = code === 'setup_conflict' ? 'conflict' : code === 'reset_owner_required' ? 'ownerOnly' : 'unavailable'
    return setupFailureNotice(locale, error, notice(key), 'legacy-reset/command')
  }
  if (args.length) return message.reply(notice('usage'))
  let prepared
  try { prepared = await prepareLegacyReset(client, context) }
  catch (error) { return message.reply(failure(error)) }
  const token = randomUUID(), yes = `legacy-reset:${token}:yes`, no = `legacy-reset:${token}:no`
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(yes).setLabel(t(locale, 'legacyReset.confirm')).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(no).setLabel(t(locale, 'legacyReset.cancel')).setStyle(ButtonStyle.Secondary))
  const prompt = await message.reply({ ...notice('preview', prepared.prefix), components: [row] })
  let claimed = false
  const collector = prompt.createMessageComponentCollector({ time: 30000,
    filter: b => b.guildId === context.guildId && b.message?.id === prompt.id && [yes, no].includes(b.customId) && b.isButton() })
  collector.on('collect', b => {
    ;(async () => {
      if (b.user.id !== context.actorId) {
        await b.reply({ ...notice('notYours'), ephemeral: true })
        return
      }
      if (claimed) { await b.deferUpdate(); return }
      claimed = true
      collector.stop('claimed')
      // A failed acknowledgement must never submit a reset in the background.
      try { await b.deferUpdate() }
      catch { await prompt.edit(notice('unavailable')).catch(() => {}); return }
      let result
      if (b.customId === no) result = notice('cancelled')
      else {
        try {
          const saved = await confirmLegacyReset(client, context, prepared)
          result = notice('saved', saved.values.prefix)
        } catch (error) { result = failure(error) }
      }
      try { await b.editReply(result) }
      catch { await prompt.edit(result).catch(() => {}) }
    })().catch(async () => {
      if (b.user.id === context.actorId && claimed) await prompt.edit(notice('unavailable')).catch(() => {})
    })
  })
  collector.on('end', () => { if (!claimed) prompt.edit(notice('expired')).catch(() => {}) })
  return prompt
}
module.exports = { runLegacyReset }
