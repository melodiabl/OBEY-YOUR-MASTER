const { targetFor } = require('./targets')
const Moderation = require('../../../../database/schemas/ModerationSchema')
const { t, localeFor } = require('../../../../handlers/i18n')
const { HistoryError, historyRequest } = require('../application/history')
const { indexFor } = require('../domain/warnings')
const { removePrefixWarnings, removeCase } = require('../application/warning-removal')

async function runPrefixRemoval(client, message, args, command) {
  const locale = localeFor(client, message.guild.id)
  let notice = 'removed'
  try {
    if (!args[0]) throw new HistoryError('invalidTarget')
    const targetId = targetFor(message, args)
    const index = command === 'unwarn' ? indexFor(args[1], true) : null
    await historyRequest(client, context => removePrefixWarnings(client, message.guild, message.author.id, targetId, index, command, context))
  } catch (error) { notice = error instanceof HistoryError ? error.code : 'unavailable' }
  return message.reply({ content: t(locale, 'moderationHistory.' + notice), allowedMentions: { parse: [], repliedUser: false } })
}

async function runSlashRemoval(client, interaction, dependencies = {}) {
  await interaction.deferReply({ ephemeral: true })
  const locale = localeFor(client, interaction.guild.id), model = dependencies.model || Moderation
  let notice = 'removed'
  try {
    const caseId = indexFor(interaction.options.getInteger('caso'))
    const reason = (interaction.options.getString('razon') || '').slice(0, 1000).toWellFormed()
    await historyRequest(client, context => removeCase(client, interaction.guild, interaction.user.id, caseId, reason, model, context), dependencies.timeoutMs ?? 15000)
  } catch (error) { notice = error instanceof HistoryError ? error.code : 'unavailable' }
  return interaction.editReply({ content: t(locale, 'moderationHistory.' + notice), allowedMentions: { parse: [] } })
}

module.exports = { runPrefixRemoval, runSlashRemoval }
