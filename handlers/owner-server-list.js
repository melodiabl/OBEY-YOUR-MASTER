const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, escapeMarkdown } = require('discord.js')
const { randomUUID } = require('node:crypto')
const { requireBotOwnerAccess } = require('./bot-owner-access')
const { localeFor, t } = require('./i18n')

async function runOwnerServers(client, message, args = [], options = {}) {
  const context = { guildId: message.guild?.id, channelId: message.channelId || message.channel?.id, actorId: message.author.id }
  const locale = localeFor(client, context.guildId)
  const notice = key => ({ content: t(locale, `ownerServers.${key}`), embeds: [], components: [], allowedMentions: { parse: [], repliedUser: false } })
  const reply = async key => { try { return await message.reply(notice(key)) } catch {} }
  const access = () => requireBotOwnerAccess(client, context, options.ownerFile)
  if (args.length) return reply('usage')
  const token = randomUUID(), ids = { previous: `servers:${token}:previous`, next: `servers:${token}:next` }
  let page = 0, pages = 1
  const payload = () => {
    const guilds = [...client.guilds.cache.values()].filter(guild => /^\d{17,20}$/.test(guild.id))
      .sort((a, b) => (Number(b.memberCount) || 0) - (Number(a.memberCount) || 0) || a.id.localeCompare(b.id))
    pages = Math.max(1, Math.ceil(guilds.length / 10)); page = Math.max(0, Math.min(page, pages - 1))
    const lines = guilds.slice(page * 10, (page + 1) * 10).map(guild => {
      const name = escapeMarkdown(String(guild.name || '').replace(/[\x00-\x1f\x7f]/g, ' ').slice(0, 80))
      return `**${name}** · \`${guild.id}\``
    })
    const embed = new EmbedBuilder().setColor(0xFFD36F).setTitle(t(locale, 'ownerServers.title'))
      .setDescription(lines.join('\n') || t(locale, 'ownerServers.empty'))
      .setFooter({ text: t(locale, 'ownerServers.page', { page: page + 1, pages, total: guilds.length }) })
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(ids.previous).setLabel(t(locale, 'ownerServers.previous')).setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
      new ButtonBuilder().setCustomId(ids.next).setLabel(t(locale, 'ownerServers.next')).setStyle(ButtonStyle.Secondary).setDisabled(page + 1 === pages))
    return { content: '', embeds: [embed], components: pages > 1 ? [row] : [], allowedMentions: { parse: [] } }
  }
  let prompt
  try {
    await access()
    const dm = await message.author.createDM()
    const first = payload()
    await access()
    prompt = await dm.send(first)
  } catch (error) { return reply(error?.code === 'setup_denied' ? 'denied' : 'unavailable') }
  await reply('sent')
  if (pages === 1) return prompt
  let collector, busy = false, finished = false
  try {
    collector = prompt.createMessageComponentCollector({ time: 120000,
      filter: button => button.isButton() && button.message?.id === prompt.id && Object.values(ids).includes(button.customId) })
  } catch { await prompt.edit({ components: [] }).catch(() => {}); return prompt }
  collector.on('collect', button => {
    ;(async () => {
      if (button.user.id !== context.actorId) { await button.reply({ ...notice('denied'), ephemeral: true }).catch(() => {}); return }
      if (busy || finished) { await button.deferUpdate().catch(() => {}); return }
      busy = true
      try {
        await button.deferUpdate()
        if (finished) return
        await access()
        if (finished) return
        page += button.customId === ids.next ? 1 : -1
        const next = payload()
        await access()
        if (!finished) await button.editReply(next)
      } catch {
        finished = true; collector.stop('unavailable')
        await prompt.edit(notice('unavailable')).catch(() => {})
      } finally { busy = false }
    })().catch(() => {})
  })
  collector.on('end', () => { finished = true; prompt.edit({ components: [] }).catch(() => {}) })
  return prompt
}
module.exports = { runOwnerServers }
