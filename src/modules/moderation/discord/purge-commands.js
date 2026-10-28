const { t, localeFor } = require('../../../../handlers/i18n')
const { purgeMessages, parseAmount } = require('../application/purge-messages')

const validId = value => typeof value === 'string' && /^\d{17,20}$/.test(value)

function prefixInput(message, args, command) {
  const amount = parseAmount(args?.[0] ?? (command === 'clearbotmessages' ? 250 : undefined), 5000)
  if (!amount) return { status: 'invalidAmount' }
  if (command === 'clearbotmessages') return { scanLimit: amount, deleteLimit: amount, filter: 'ownBot' }
  const raw = args?.[1]
  if (!raw) return { scanLimit: amount, deleteLimit: amount, filter: 'all' }
  if (['bot', 'bots'].includes(String(raw).toLowerCase()))
    return { scanLimit: amount, deleteLimit: amount, filter: 'bots' }
  const mentioned = message.mentions?.users?.first?.()?.id || message.mentions?.members?.first?.()?.id
  const userId = mentioned || String(raw).match(/^<@!?(\d{17,20})>$/)?.[1] || (validId(raw) ? raw : null)
  return userId ? { scanLimit: amount, deleteLimit: amount, filter: 'user', userId }
    : { status: 'invalidFilter' }
}

function purgeReply(locale, result) {
  return { content: t(locale, 'moderationPurge.' + (result?.status || 'unavailable'), {
    count: result?.deleted ?? 0, scanned: result?.scanned ?? 0,
  }), allowedMentions: { parse: [], repliedUser: false } }
}

async function runPrefixPurge(client, message, args, command) {
  const locale = localeFor(client, message.guild?.id)
  const parsed = prefixInput(message, args, command)
  let result = parsed
  if (!parsed.status) {
    try { result = await purgeMessages(client, {
      guild: message.guild, channelId: message.channel?.id, actorId: message.author?.id,
      policy: 'prefix', command, ...parsed,
    }) } catch { result = { status: 'unavailable' } }
  }
  const reply = purgeReply(locale, result)
  try { return await message.channel.send(reply) }
  catch { try { return await message.author.send(reply) } catch { return undefined } }
}

async function runSlashPurge(client, interaction) {
  const locale = localeFor(client, interaction.guild?.id)
  let result
  try {
    await interaction.deferReply({ ephemeral: true })
    const amount = parseAmount(interaction.options.getInteger('cantidad'), 99)
    const selected = interaction.options.getString('filtro') || 'all'
    const userId = interaction.options.getUser('usuario')?.id
    result = amount ? await purgeMessages(client, {
      guild: interaction.guild, channelId: interaction.channelId, actorId: interaction.user.id,
      policy: 'slash', command: 'purge', scanLimit: 100, deleteLimit: amount,
      filter: userId ? 'user' : selected, userId,
    }) : { status: 'invalidAmount' }
  } catch { result = { status: 'unavailable' } }
  try { return await interaction.editReply(purgeReply(locale, result)) }
  catch { return undefined }
}

module.exports = { runPrefixPurge, runSlashPurge, prefixInput, purgeReply }
