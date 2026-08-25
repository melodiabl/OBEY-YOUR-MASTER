const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

function fmtMs(ms) {
  const s = Math.floor((ms || 0) / 1000), m = Math.floor(s / 60), sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

const PER_PAGE = 10

function buildPage(state, page) {
  const q    = state.queue
  const cur  = state.currentTrack
  const ci   = cur?.info || cur
  const pages = Math.max(1, Math.ceil(q.length / PER_PAGE))
  const p    = Math.min(Math.max(1, page), pages)
  const slice = q.slice((p - 1) * PER_PAGE, p * PER_PAGE)
  const totalMs = q.reduce((a, t) => a + (t.info?.length || 0), 0)

  const lines = []
  if (ci) lines.push(`🎵 **Ahora:** [${(ci?.title || '?').substring(0, 55)}](${ci?.uri || ''}) — \`${fmtMs(ci?.length)}\`\n`)
  if (!slice.length && !ci) {
    lines.push('_La cola está vacía._')
  } else {
    slice.forEach((t, i) => {
      const info = t.info || t
      lines.push(`\`${(p - 1) * PER_PAGE + i + 1}.\` [${(info?.title || '?').substring(0, 50)}](${info?.uri || ''}) — \`${fmtMs(info?.length)}\``)
    })
    if (q.length) lines.push(`\n**${q.length}** pistas en cola · duración total: \`${fmtMs(totalMs)}\``)
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📋 Cola de ${state._guildName || 'reproducción'}`)
    .setDescription(lines.join('\n') || '​')
    .setFooter({ text: `Página ${p}/${pages}` })

  return { embed, page: p, pages }
}

function buildPageRow(page, pages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('pq_prev').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId('pq_close').setLabel('Cerrar').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('pq_next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page >= pages),
  )
}

module.exports = {
  name: 'queue',
  category: '🎶 Music',
  aliases: ['qu', 'que', 'queu', 'list'],
  description: 'Muestra la cola de reproducción',
  usage: 'queue [página]',
  parameters: { type: 'music', activeplayer: true, previoussong: false },

  run: async (client, message, args) => {
    const es = client.settings.get(message.guild.id, 'embed')
    const ls = client.settings.get(message.guild.id, 'language')

    if (!client.settings.get(message.guild.id, 'MUSIC')) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle(client.la[ls].common.disabled.title)] })
    }

    const state = client.music?.getState(message.guild.id)
    if (!state?.currentTrack) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(es.wrongcolor).setTitle('❌ No hay música reproduciéndose.')] })
    }

    // attach guild name for embed title
    state._guildName = message.guild.name

    let page = parseInt(args[0]) || 1
    const { embed, page: p, pages } = buildPage(state, page)
    const reply = await message.reply({ embeds: [embed], components: pages > 1 ? [buildPageRow(p, pages)] : [] })

    if (pages <= 1) return

    const collector = reply.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time:   120_000,
    })

    let currentPage = p
    collector.on('collect', async i => {
      await i.deferUpdate()
      if (i.customId === 'pq_close') {
        collector.stop('closed')
        return reply.edit({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription('📋 Cola cerrada.')], components: [] })
      }
      currentPage += i.customId === 'pq_next' ? 1 : -1
      const freshState = client.music?.getState(message.guild.id)
      if (!freshState) return
      freshState._guildName = message.guild.name
      const { embed: newEmbed, page: newP, pages: newPages } = buildPage(freshState, currentPage)
      currentPage = newP
      await reply.edit({ embeds: [newEmbed], components: [buildPageRow(newP, newPages)] })
    })

    collector.on('end', (_, reason) => {
      if (reason !== 'closed') {
        reply.edit({ components: [] }).catch(() => {})
      }
    })
  },
}
