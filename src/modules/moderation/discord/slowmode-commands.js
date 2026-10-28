const { t, localeFor } = require('../../../../handlers/i18n')
const { changeSlowmode } = require('../application/slowmode')

function slowmodeReply(locale, result) {
  const status = result?.status || 'unavailable'
  return { content: t(locale, 'moderationSlowmode.' + status,
    { channel: result?.channelId ? `<#${result.channelId}>` : '', seconds: result?.seconds ?? 0 }),
  allowedMentions: { parse: [], repliedUser: false } }
}

async function runPrefixSlowmode(client, message, args) {
  const locale = localeFor(client, message.guild?.id)
  let result
  try { result = await changeSlowmode(client, { guild: message.guild, actorId: message.author.id,
    channelId: message.channel.id, seconds: args[0], transport: 'prefix' }) }
  catch { result = { status: 'unavailable' } }
  const reply = slowmodeReply(locale, result)
  try { return await message.reply(reply) }
  catch { try { return await message.author.send(reply) } catch { return undefined } }
}

async function runSlashSlowmode(client, interaction) {
  await interaction.deferReply({ ephemeral: true })
  const locale = localeFor(client, interaction.guild?.id)
  let result
  try { result = await changeSlowmode(client, { guild: interaction.guild, actorId: interaction.user.id,
    channelId: (interaction.options.getChannel('canal') || interaction.channel)?.id,
    seconds: interaction.options.getInteger('segundos'), transport: 'slash' }) }
  catch { result = { status: 'unavailable' } }
  return interaction.editReply(slowmodeReply(locale, result))
}

module.exports = { runPrefixSlowmode, runSlashSlowmode, slowmodeReply }
