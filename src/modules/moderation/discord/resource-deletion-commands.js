const { randomUUID } = require('node:crypto')
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const { localeFor, t } = require('../../../../handlers/i18n')
const { resourceId, inspectResourceDeletion, deleteResource } = require('../application/resource-deletion')

function deletionReply(locale, result) {
  return { content: t(locale, 'moderationDeletion.' + result.status, { id: result.targetId || '' }),
    allowedMentions: { parse: [], repliedUser: false }, components: [] }
}

async function sendResult(message, payload) {
  try { return await message.reply(payload) }
  catch { try { return await message.author.send(payload) } catch { return undefined } }
}

async function runChannelDeletion(client, message, args) {
  const locale = localeFor(client, message.guild?.id)
  let result
  try { result = await deleteResource(client, message, resourceId(message, args, 'channel'), 'channel') }
  catch { result = { status: 'unavailable' } }
  return sendResult(message, deletionReply(locale, result))
}

async function runRoleDeletion(client, message, args) {
  const locale = localeFor(client, message.guild?.id), targetId = resourceId(message, args, 'role')
  let access
  try { access = await inspectResourceDeletion(client, message, targetId, 'role') }
  catch { access = { status: 'unavailable' } }
  if (access.status !== 'ready') return sendResult(message, deletionReply(locale, access))
  const token = randomUUID(), yes = `delete-role:${token}:yes`, no = `delete-role:${token}:no`
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(yes).setLabel(t(locale, 'moderationDeletion.confirm')).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(no).setLabel(t(locale, 'moderationDeletion.cancel')).setStyle(ButtonStyle.Secondary))
  let prompt
  try { prompt = await message.reply({ ...deletionReply(locale, { status: 'preview', targetId }), components: [row] }) }
  catch { return undefined }
  let claimed = false
  const collector = prompt.createMessageComponentCollector({ time: 30000,
    filter: b => b.message?.id === prompt.id && b.guildId === message.guild.id && [yes, no].includes(b.customId) })
  collector.on('collect', b => {
    ;(async () => {
      if (b.user.id !== message.author.id) {
        await b.reply({ content: t(locale, 'moderationDeletion.ownerOnly'), ephemeral: true, allowedMentions: { parse: [] } })
        return
      }
      if (claimed) { await b.deferUpdate(); return }
      claimed = true
      collector.stop('claimed')
      await b.deferUpdate()
      const result = b.customId === no ? { status: 'cancelled' }
        : await deleteResource(client, message, targetId, 'role')
      await b.editReply(deletionReply(locale, result))
    })().catch(async () => {
      if (b.user.id === message.author.id && claimed) {
        try { await prompt.edit(deletionReply(locale, { status: 'unavailable' })) } catch {}
      }
    })
  })
  collector.on('end', () => {
    if (!claimed) prompt.edit(deletionReply(locale, { status: 'expired' })).catch(() => {})
  })
  return prompt
}

module.exports = { runChannelDeletion, runRoleDeletion, deletionReply }
