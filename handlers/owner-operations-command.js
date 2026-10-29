const { EmbedBuilder, escapeMarkdown, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { randomUUID } = require('node:crypto')
const { requireBotOwnerAccess } = require('./bot-owner-access')
const { readBotIdentity } = require('./owner-operations')
const { localeFor, t } = require('./i18n')
async function runOwnerOperation(client, message, args = [], kind, options = {}) {
  const context = { guildId: message.guild?.id, channelId: message.channelId || message.channel?.id, actorId: message.author.id }, locale = localeFor(client, context.guildId)
  const notice = key => ({ content: t(locale, `ownerOps.${key}`), embeds: [], components: [], allowedMentions: { parse: [], repliedUser: false } })
  const failure = error => notice(error?.code === 'setup_denied' ? 'denied' : 'unavailable')
  const reply = async payload => { try { return await message.reply(payload) } catch { return null } }
  if (args.length) return reply(notice('usage'))
  if (kind !== 'restart') {
    const progress = await reply(notice('checking'))
    if (!progress) return
    let payload
    try {
      if (kind === 'identity') {
        const data = await readBotIdentity(client, context, options), safe = value => escapeMarkdown(String(value))
        const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(t(locale, 'ownerOps.identityTitle'))
          .addFields({ name: t(locale, 'ownerOps.bot'), value: `${safe(data.botName)}\n${safe(data.botId)}` },
            { name: t(locale, 'ownerOps.application'), value: data.application ? safe(data.application.name) : t(locale, 'ownerOps.applicationUnavailable') },
            { name: t(locale, 'ownerOps.versions'), value: `OBEY ${safe(data.version)} · Node ${safe(data.node)} · Discord.js ${safe(data.discord)}` })
        payload = { ...notice('identity'), embeds: [embed] }
      } else {
        await requireBotOwnerAccess(client, context, options.ownerFile)
        payload = notice(kind === 'stop' ? 'stopDisabled' : 'reloadDisabled')
      }
    } catch (error) { payload = failure(error) }
    try { return await progress.edit(payload) } catch { return reply(payload) }
  }
  try { await requireBotOwnerAccess(client, context, options.ownerFile) } catch (error) { return reply(failure(error)) }
  if (!client.botRestart?.available()) return reply(notice('restartUnavailable'))
  const token = randomUUID(), ids = { confirm: `restart:${token}:confirm`, cancel: `restart:${token}:cancel` }
  const controls = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(ids.confirm).setLabel(t(locale, 'ownerOps.confirm')).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(ids.cancel).setLabel(t(locale, 'ownerOps.cancel')).setStyle(ButtonStyle.Secondary))
  const prompt = await reply({ ...notice('restartPreview'), components: [controls] })
  if (!prompt) return
  let collector
  try { collector = prompt.createMessageComponentCollector({ time: 30000, filter: b => b.guildId === context.guildId && b.message?.id === prompt.id && Object.values(ids).includes(b.customId) && b.isButton() }) }
  catch { await prompt.edit(notice('unavailable')).catch(() => {}); return }
  let finished = false, busy = false
  collector.on('collect', b => {
    ;(async () => {
      if (b.user.id !== context.actorId) { await b.reply({ ...notice('notYours'), ephemeral: true }).catch(() => {}); return }
      if (finished || busy) { await b.deferUpdate().catch(() => {}); return }
      busy = true
      let reservation
      try {
        await b.deferUpdate()
        if (finished) return
        if (b.customId === ids.cancel) { finished = true; collector.stop('cancelled'); await b.editReply(notice('cancelled')); return }
        await requireBotOwnerAccess(client, context, options.ownerFile)
        if (finished) return
        reservation = client.botRestart?.prepare()
        if (!reservation) { finished = true; collector.stop('unavailable'); await b.editReply(notice('restartUnavailable')); return }
        finished = true; collector.stop('claimed')
        await b.editReply(notice('requesting'))
        await requireBotOwnerAccess(client, context, options.ownerFile)
        if (!reservation.commit()) await b.editReply(notice('restartUnavailable'))
      } catch (error) {
        if (!finished) { finished = true; collector.stop('failed') }
        await prompt.edit(failure(error)).catch(() => {})
      } finally { reservation?.cancel(); busy = false }
    })().catch(() => {})
  })
  collector.on('end', () => { if (!finished) { finished = true; prompt.edit(notice('expired')).catch(() => {}) } })
  return prompt
}
module.exports = { runOwnerOperation }
