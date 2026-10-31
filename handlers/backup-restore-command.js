const { ActionRowBuilder, ButtonBuilder, ButtonStyle, escapeMarkdown } = require('discord.js')
const { randomUUID } = require('node:crypto')
const { prepareRestore, confirmRestore } = require('./backup-restore')
const { localeFor, t } = require('./i18n')

async function runBackupRestore(client, message, args = [], options = {}) {
  const context = { guildId: message.guild?.id, channelId: message.channelId || message.channel?.id, actorId: message.author.id }
  const locale = localeFor(client, context.guildId)
  const notice = (key, variables) => ({ content: t(locale, `backupRestore.${key}`, variables), embeds: [], components: [], allowedMentions: { parse: [], repliedUser: false } })
  const failure = error => notice(({
    restore_invalid: 'usage', restore_denied: 'denied', restore_conflict: 'conflict', restore_expired: 'expired',
    restore_busy: 'busy', restore_unconfirmed: 'unconfirmed', restore_timeout: 'unavailable', restore_invalid_backup: 'invalidBackup', restore_delivery: 'delivery'
  })[error?.code] || 'unavailable')
  const reply = async payload => { try { return await message.reply(payload) } catch { return null } }
  if (args.length !== 2) return reply(notice('usage'))
  let prepared
  try { prepared = await prepareRestore(client, context, args[0], args[1], options) }
  catch (error) { return reply(failure(error)) }
  const token = randomUUID(), ids = { confirm: `restore:${token}:confirm`, cancel: `restore:${token}:cancel` }
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(ids.confirm).setLabel(t(locale, 'backupRestore.confirm')).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(ids.cancel).setLabel(t(locale, 'backupRestore.cancel')).setStyle(ButtonStyle.Secondary))
  const preview = notice('preview', { name: escapeMarkdown(prepared.targetName), target: prepared.targetId, source: prepared.sourceId,
    backup: prepared.backupId, slot: prepared.slot, created: Math.floor(prepared.createdTimestamp / 1000) })
  const prompt = await reply({ ...preview, components: [row] })
  if (!prompt) return
  let collector, finished = false, busy = false
  try { collector = prompt.createMessageComponentCollector({ time: Math.max(1, prepared.expiresAt - Date.now()),
    filter: button => button.isButton() && button.guildId === context.guildId && button.message?.id === prompt.id && Object.values(ids).includes(button.customId) }) }
  catch { await prompt.edit(notice('unavailable')).catch(() => {}); return }
  collector.on('collect', button => {
    ;(async () => {
      if (button.user.id !== context.actorId) { await button.reply({ ...notice('notYours'), ephemeral: true }).catch(() => {}); return }
      if (finished || busy) { await button.deferUpdate().catch(() => {}); return }
      busy = true
      let dm
      try {
        await button.deferUpdate()
        if (finished) return
        finished = true; collector.stop('claimed')
        if (button.customId === ids.cancel) { await button.editReply(notice('cancelled')); return }
        let result
        try {
          await confirmRestore(client, context, prepared, { ...options, beforeLoad: async () => {
            await button.editReply(notice('preparing'))
            dm = await message.author.createDM()
            await dm.send(notice('requesting', { target: prepared.targetId, backup: prepared.backupId }))
          } })
          result = notice('returned', { target: prepared.targetId })
        } catch (error) { result = failure(error) }
        // Restoring can delete the original channel. Never repeat the effect to deliver a result.
        if (dm) { try { await dm.send(result) } catch {} }
        try { await button.editReply(result) } catch { await prompt.edit(result).catch(() => {}) }
      } catch { finished = true; collector.stop('failed'); await prompt.edit(notice('unavailable')).catch(() => {}) }
      finally { busy = false }
    })().catch(() => {})
  })
  collector.on('end', () => { if (!finished) { finished = true; prompt.edit(notice('expired')).catch(() => {}) } })
  return prompt
}
module.exports = { runBackupRestore }
