const { createHash } = require('node:crypto')
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, escapeMarkdown } = require('discord.js')
const { registry } = require('./assets/registry')
const { helpService } = require('./help')
const PER_PAGE = 5
const token = category => createHash('sha256').update(category).digest('hex').slice(0, 20)
const text = (value, limit) => escapeMarkdown(String(value || '').slice(0, limit)).slice(0, limit)
const button = (id, label, icon, disabled = false) => new ButtonBuilder().setCustomId(id).setLabel(label).setEmoji(registry.emoji(icon)).setStyle(ButtonStyle.Secondary).setDisabled(disabled)

function buildHelpMessage(view, state = {}) {
  const categories = view.categories, categoryPages = Math.max(1, Math.ceil(categories.length / 25))
  const categoryPage = Math.max(0, Math.min(categoryPages - 1, state.categoryPage || 0))
  const selected = categories.includes(state.category) ? state.category : null
  const entries = selected ? view.commands.filter(entry => entry.category === selected) : []
  const pages = Math.max(1, Math.ceil(entries.length / PER_PAGE)), page = Math.max(0, Math.min(pages - 1, state.page || 0))
  const detail = state.detailId && view.commands.find(entry => entry.id === state.detailId)
  const embed = new EmbedBuilder().setColor(0xFFD36F)
  if (detail) {
    embed.setTitle(text(detail.transport === 'prefix' ? view.prefix + detail.name : detail.invocation, 256)).setDescription(text(detail.description, 1500))
      .addFields({ name: 'Categoría', value: text(detail.category, 100), inline: true }, { name: 'Espera entre usos', value: String(detail.cooldownSeconds) + ' s', inline: true },
        { name: 'Uso', value: text((detail.transport === 'prefix' ? view.prefix : '') + detail.usage, 1000) })
    if (detail.aliases.length) embed.addFields({ name: 'Alias', value: text(detail.aliases.join(', '), 1000) })
    if (detail.permissions.length) embed.addFields({ name: 'Permisos', value: text(detail.permissions.join(', '), 1000) })
  } else if (selected) {
    const description = entries.slice(page * PER_PAGE, (page + 1) * PER_PAGE).map(entry => '**' + text(entry.transport === 'prefix' ? view.prefix + entry.name : entry.invocation, 120) + '**\n' + text(entry.description, 240)).join('\n\n')
    embed.setTitle('Comandos de ' + text(selected, 200)).setDescription(description || 'No hay comandos disponibles en esta categoría.')
      .setFooter({ text: 'Página ' + (page + 1) + '/' + pages + ' · ' + entries.length + ' comandos' })
  } else {
    embed.setTitle('Ayuda de OBEY').setDescription([
      '¿Qué necesitas hacer? Elige una categoría para ver los comandos disponibles.',
      view.counts.prefix + ' comandos de prefijo y ' + view.counts.slash + ' comandos slash disponibles en este contexto.',
      view.query && !view.detail ? 'No encuentro ese comando disponible en este contexto.' : '',
      categories.length ? categories.slice(categoryPage * 25, (categoryPage + 1) * 25).map(category => '• ' + text(category, 70)).join('\n') : 'No hay comandos disponibles con estos permisos y en este canal.',
      'También puedes buscar: ' + text(view.prefix, 32) + 'help comando o /info help comando.',
    ].filter(Boolean).join('\n\n')).setFooter({ text: 'Al ejecutar se comprueban también el destino y sus requisitos.' })
  }
  const components = []
  if (categories.length) {
    components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('hm_select').setPlaceholder('Elige una categoría')
      .addOptions(categories.slice(categoryPage * 25, (categoryPage + 1) * 25).map(category => ({ label: category.slice(0, 100), value: token(category), description: 'Ver comandos disponibles', default: category === selected })))))
    if (categoryPages > 1) components.push(new ActionRowBuilder().addComponents(button('hm_categories_prev', 'Categorías anteriores', 'previous', categoryPage === 0), button('hm_categories_next', 'Más categorías', 'next', categoryPage === categoryPages - 1)))
    if (selected || detail) components.push(new ActionRowBuilder().addComponents(button('hm_prev', 'Anterior', 'previous', page === 0 || Boolean(detail)), button('hm_home', 'Inicio', 'home'), button('hm_next', 'Siguiente', 'next', page === pages - 1 || Boolean(detail))))
  }
  return { embeds: [embed], components, allowedMentions: { parse: [], repliedUser: false } }
}

function attachCollector(reader, message, context, initialState) {
  const state = { ...initialState }, collector = message.createMessageComponentCollector({ time: 180000 })
  const controls = new Set(['hm_select', 'hm_home', 'hm_prev', 'hm_next', 'hm_categories_prev', 'hm_categories_next'])
  let closed = false, queue = Promise.resolve()
  collector.on('collect', async interaction => {
    if (interaction.user.id !== context.actorId || interaction.guildId !== context.guildId || interaction.message?.id !== message.id || !controls.has(interaction.customId)) {
      return interaction.reply({ content: 'Este control no está disponible para ti. Abre tu propia ayuda.', ephemeral: true }).catch(() => {})
    }
    let acknowledgement
    try { acknowledgement = Promise.resolve(interaction.deferUpdate()).then(() => true, () => false) } catch { return }
    queue = queue.then(async () => {
      if (!await acknowledgement || closed) return
      try {
        const view = await reader.read(context)
        if (closed) return
        state.categoryPage = Math.max(0, Math.min(Math.max(0, Math.ceil(view.categories.length / 25) - 1), state.categoryPage || 0))
        const currentPages = Math.max(1, Math.ceil(view.commands.filter(entry => entry.category === state.category).length / PER_PAGE))
        state.page = Math.max(0, Math.min(currentPages - 1, state.page || 0))
        if (interaction.customId === 'hm_select') {
          state.category = view.categories.find(category => token(category) === interaction.values?.[0]) || null
          state.page = 0; state.detailId = null
        } else if (interaction.customId === 'hm_home') { state.category = null; state.detailId = null; state.page = 0 }
        else if (interaction.customId.startsWith('hm_categories_')) { state.categoryPage = Math.max(0, (state.categoryPage || 0) + (interaction.customId.endsWith('next') ? 1 : -1)) }
        else { state.page = Math.max(0, (state.page || 0) + (interaction.customId === 'hm_next' ? 1 : -1)) }
        if (!view.categories.includes(state.category)) state.category = null
        const pages = Math.max(1, Math.ceil(view.commands.filter(entry => entry.category === state.category).length / PER_PAGE))
        state.page = Math.max(0, Math.min(pages - 1, state.page || 0))
        state.categoryPage = Math.min(Math.max(0, Math.ceil(view.categories.length / 25) - 1), state.categoryPage || 0)
        await interaction.editReply(buildHelpMessage(view, state))
      } catch {
        if (closed) return
        closed = true
        await interaction.editReply({ content: 'No pude comprobar tu acceso actual. Abre la ayuda de nuevo para reintentar.', embeds: [], components: [], allowedMentions: { parse: [] } }).catch(() => {})
        collector.stop('unavailable')
      }
    }).catch(() => {})
  })
  collector.on('end', () => { closed = true; message.edit({ components: [] }).catch(() => {}) })
  return collector
}

async function openHelp(client, origin, query = '', slash = false) {
  if (slash) await origin.deferReply({ ephemeral: true })
  const context = { guildId: origin.guild?.id, actorId: (origin.user || origin.author)?.id, channelId: origin.channelId || origin.channel?.id }
  const reader = helpService(client)
  try {
    const view = await reader.read({ ...context, query }), state = { detailId: view.detail?.id, page: 0, categoryPage: 0 }
    const payload = buildHelpMessage(view, state)
    let message
    if (slash) { await origin.editReply(payload); message = await origin.fetchReply() }
    else message = await origin.reply(payload)
    if (message && view.categories.length) attachCollector(reader, message, context, state)
  } catch {
    const payload = { content: 'No pude comprobar tu acceso a la ayuda. Inténtalo de nuevo.', embeds: [], components: [], allowedMentions: { parse: [] } }
    if (slash) await origin.editReply(payload)
    else await origin.reply(payload)
  }
}
module.exports = { buildHelpMessage, attachCollector, openHelp }
