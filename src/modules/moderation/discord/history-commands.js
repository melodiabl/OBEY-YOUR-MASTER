const { targetFor } = require('./targets')
const Moderation = require('../../../../database/schemas/ModerationSchema')
const { t, localeFor } = require('../../../../handlers/i18n')
const { validId, indexFor } = require('../domain/warnings')
const { pageEmbed } = require('./history-view')
const { HistoryError, historyRequest, readLegacyHistory, readNativeHistory } = require('../application/history')
const commands = new Set(['warnings', 'globalwarnings', 'detailwarn'])

async function runPrefixHistory(client, message, args, command) {
  const locale = localeFor(client, message.guild.id)
  let notice = 'sent'
  try {
    if (!commands.has(command)) throw new HistoryError('accessDenied')
    await historyRequest(client, async context => {
      const targetId = targetFor(message, args), requested = indexFor(args[1], command === 'detailwarn')
      const { selected, total, page, perPage, detail } = await readLegacyHistory(
        client, message.guild, message.author.id, targetId, requested, command, context,
      )
      const payload = pageEmbed(locale, { rows: selected, total, page, perPage, targetId, detail, legacy: true, guilds: client.guilds.cache })
      context.check()
      try { await message.author.send(payload) } catch { throw new HistoryError('deliveryUnconfirmed') }
    })
  } catch (error) { notice = error instanceof HistoryError ? error.code : 'unavailable' }
  return message.reply({ content: t(locale, 'moderationHistory.' + notice), allowedMentions: { parse: [], repliedUser: false } })
}
async function runSlashCases(client, interaction, dependencies = {}) {
  await interaction.deferReply({ ephemeral: true })
  const locale = localeFor(client, interaction.guild.id), model = dependencies.model || Moderation
  try {
    return await historyRequest(client, async context => {
      const guild = interaction.guild, actorId = interaction.user.id
      const targetId = interaction.options.getUser('usuario')?.id
      if (!validId(targetId)) throw new HistoryError('invalidTarget')
      const requested = indexFor(interaction.options.getInteger('pagina') ?? 1)
      const { rows, total, page, perPage } = await readNativeHistory(client, model, guild, actorId, targetId, requested, context)
      const payload = pageEmbed(locale, { rows, total, page, perPage, targetId, legacy: false })
      context.check()
      return interaction.editReply(payload)
    }, dependencies.timeoutMs ?? 15000)
  } catch (error) {
    return interaction.editReply({ content: t(locale, 'moderationHistory.' + (error instanceof HistoryError ? error.code : 'unavailable')), allowedMentions: { parse: [] } })
  }
}
module.exports = { runPrefixHistory, runSlashCases }
