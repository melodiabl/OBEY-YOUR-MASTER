const { randomUUID } = require('node:crypto')
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js')

function paginate(text, maxLength = 1800) {
  if (typeof text !== 'string') return []
  if (!Number.isInteger(maxLength) || maxLength < 2 || maxLength > 4000) throw new Error('Invalid lyrics page size')
  const pages = []
  let offset = 0
  while (offset < text.length) {
    let end = Math.min(offset + maxLength, text.length)
    if (end < text.length) {
      const newline = text.lastIndexOf('\n', end - 1)
      if (newline >= offset + Math.floor(maxLength / 2)) end = newline + 1
      const last = text.charCodeAt(end - 1)
      if (last >= 0xD800 && last <= 0xDBFF) end--
    }
    pages.push(text.slice(offset, end))
    offset = end
  }
  return pages
}

async function showLyrics(interaction, { text, title = 'Letras', artist = '', isCurrent = () => true }, replyMethod = 'editReply') {
  const allowedMentions = { parse: [] }
  const reply = payload => interaction[replyMethod]({ ...payload, allowedMentions, ...(replyMethod === 'followUp' ? { ephemeral: true } : {}) })
  if (!isCurrent()) return reply({ content: 'La canción cambió. Vuelve a solicitar sus letras.', embeds: [], components: [] })
  if (typeof text !== 'string' || !text.trim()) return reply({ content: 'No se encontraron letras para esta canción.', embeds: [], components: [] })
  const pages = paginate(text)
  let page = 0, active = true, pending = Promise.resolve()
  const token = randomUUID(), prefix = `ly:v1:${token}:`
  const seen = new Set()
  const guildId = interaction.guildId || interaction.guild?.id
  const rows = disabled => [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(prefix + 'prev').setLabel('Anterior').setStyle(ButtonStyle.Secondary).setDisabled(disabled || page === 0),
    new ButtonBuilder().setCustomId(prefix + 'next').setLabel('Siguiente').setStyle(ButtonStyle.Secondary).setDisabled(disabled || page === pages.length - 1),
    new ButtonBuilder().setCustomId(prefix + 'close').setLabel('Cerrar').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
  )]
  const payload = () => ({ content: '', embeds: [new EmbedBuilder().setColor(0x5865F2)
    .setTitle(paginate(`🎵 ${title}${artist ? ` — ${artist}` : ''}`, 256)[0])
    .setDescription(pages[page]).setFooter({ text: `Página ${page + 1}/${pages.length}` })], components: pages.length > 1 ? rows(false) : [], allowedMentions })
  const response = await reply(payload())
  const message = response?.createMessageComponentCollector ? response : await interaction.fetchReply()
  if (!isCurrent()) return message.edit({ content: 'La canción cambió. Vuelve a solicitar sus letras.', embeds: [], components: [], allowedMentions })
  if (pages.length === 1) return message
  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000,
    filter: button => button.isButton() && ['prev', 'next', 'close'].some(action => button.customId === prefix + action) })
  const disable = () => message.edit({ components: rows(true), allowedMentions }).catch(() => {})
  async function collect(button) {
    if (button.user?.id !== interaction.user.id || (button.guildId || button.guild?.id) !== guildId || button.message?.id !== message.id) {
      await button.reply({ content: 'Esta vista pertenece a otra solicitud de letras.', ephemeral: true, allowedMentions }).catch(() => {})
      return
    }
    if (seen.has(button.id)) return
    if (seen.size >= 500) {
      await button.deferUpdate()
      collector.stop('limit')
      return
    }
    seen.add(button.id)
    // Acknowledge before joining the edit queue so slow Discord writes cannot expire the interaction.
    await button.deferUpdate()
    pending = pending.then(async () => {
      if (!active) return
      if (!isCurrent()) { collector.stop('track_changed'); return }
      const action = button.customId.slice(prefix.length)
      if (action === 'close') { collector.stop('close'); return }
      const next = Math.max(0, Math.min(pages.length - 1, page + (action === 'next' ? 1 : -1)))
      if (next === page) return
      const previous = page
      page = next
      try { await message.edit(payload()) }
      catch { page = previous; collector.stop('message_unavailable') }
    }).catch(() => { collector.stop('failed') })
  }
  collector.on('collect', button => { collect(button).catch(() => { collector.stop('failed') }) })
  collector.once('end', () => {
    active = false
    // If an edit is in flight, disable after it; never restore live controls after expiry.
    pending = pending.then(disable).catch(() => {})
  })
  return message
}
module.exports = { paginate, showLyrics }
