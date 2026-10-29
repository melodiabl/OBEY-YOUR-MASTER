const { randomUUID } = require('node:crypto')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { authorizeGlobalReset, prepareGlobalReset, confirmGlobalReset } = require('./global-reset-settings')
const { localeFor, t } = require('./i18n')
async function runGlobalReset(client, message, args = []) {
  const locale = localeFor(client, message.guild?.id), context = { guildId: message.guild?.id, channelId: message.channel?.id, actorId: message.author.id }
  const notice = key => ({ content: t(locale, 'globalReset.' + key), embeds: [], components: [], allowedMentions: { parse: [], repliedUser: false } })
  const failure = error => notice(({ global_reset_owner: 'ownerOnly', global_reset_conflict: 'conflict', global_reset_large: 'tooLarge', global_reset_unconfirmed: 'unconfirmed' })[error.code] || 'unavailable')
  if (args.length) return message.reply(notice('usage'))
  try { await authorizeGlobalReset(client, context) }
  catch (error) { return message.reply(failure(error)) }
  const token = randomUUID(), ids = Object.fromEntries(['configuration', 'data', 'confirm', 'back', 'cancel'].map(action => [action, `global-reset:${token}:${action}`]))
  let confirmId = null
  const button = (action, label, style) => new ButtonBuilder().setCustomId(action === 'confirm' ? confirmId : ids[action]).setLabel(t(locale, 'globalReset.' + label)).setStyle(style)
  const choices = () => ({ ...notice('choose'), components: [new ActionRowBuilder().addComponents(button('configuration', 'configuration', ButtonStyle.Primary), button('data', 'data', ButtonStyle.Secondary), button('cancel', 'cancel', ButtonStyle.Secondary))] })
  const prompt = await message.reply(choices())
  const collector = prompt.createMessageComponentCollector({ time: 60000, filter: b => b.guildId === context.guildId && b.message?.id === prompt.id && (Object.values(ids).includes(b.customId) || b.customId.startsWith(ids.confirm + ':')) && b.isButton() })
  let busy = false, finished = false, prepared = null
  collector.on('collect', b => {
    ;(async () => {
      if (b.user.id !== context.actorId) { await b.reply({ ...notice('notYours'), ephemeral: true }); return }
      if (b.customId.startsWith(ids.confirm) && (b.customId !== confirmId || !prepared)) { await b.reply({ ...notice('stale'), ephemeral: true }); return }
      if (busy || finished) { await b.deferUpdate(); return }
      busy = true
      try {
        await b.deferUpdate()
        if (finished) return
        if (b.customId === ids.cancel) { finished = true; collector.stop('done'); await b.editReply(notice('cancelled')); return }
        if (b.customId === ids.back) { prepared = null; confirmId = null; await authorizeGlobalReset(client, context); if (!finished) await b.editReply(choices()); return }
        if (b.customId === confirmId) {
          if (!prepared) return
          finished = true; collector.stop('claimed')
          await b.editReply(notice('saving'))
          const result = await confirmGlobalReset(client, context, prepared)
          const response = notice(result.mode === 'data' ? 'savedData' : 'savedConfiguration')
          try { await b.editReply(response) } catch { await prompt.edit(response).catch(() => {}) }
          return
        }
        const mode = b.customId === ids.configuration ? 'configuration' : 'data'
        prepared = null; confirmId = null
        await b.editReply(notice('reading'))
        const selected = await prepareGlobalReset(client, context, mode)
        if (finished) return
        prepared = selected
        confirmId = ids.confirm + ':' + randomUUID()
        await b.editReply({ ...notice(mode === 'data' ? 'previewData' : 'previewConfiguration'), components: [new ActionRowBuilder().addComponents(button('confirm', 'confirm', ButtonStyle.Danger), button('back', 'back', ButtonStyle.Secondary), button('cancel', 'cancel', ButtonStyle.Secondary))] })
      } catch (error) {
        if (!finished) { finished = true; collector.stop('failed') }
        await prompt.edit(failure(error)).catch(() => {})
      } finally { busy = false }
    })().catch(() => {})
  })
  collector.on('end', () => { if (!finished) { finished = true; prepared = null; prompt.edit(notice('expired')).catch(() => {}) } })
  return prompt
}
module.exports = { runGlobalReset }
