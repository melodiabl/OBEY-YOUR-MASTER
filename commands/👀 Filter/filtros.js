// Menú de filtros de audio estilo Soundy: select menu que aplica el filtro al instante.
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const { FILTER_NAMES, filterLabel } = require('../../handlers/music/filters')

const EMO = {
  bassboost: '🔊', treblebass: '🎚️', nightcore: '⚡', vaporwave: '🌊', lofi: '🎧',
  slowed: '🐢', crystal: '💎', '8d': '🔄', tremolo: '〰️', vibrato: '📳', metal: '🤘',
  pop: '🎵', soft: '☁️', karaoke: '🎤', normalizar: '📊', eco: '🔉', radio: '📻',
}

module.exports = {
  name: 'filtros',
  category: '👀 Filter',
  aliases: ['filters', 'filtro', 'fx'],
  description: 'Menú interactivo de filtros de audio (estilo Soundy)',
  usage: 'filtros',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state?.currentTrack) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay música reproduciéndose.')] }).catch(() => {})
    }

    const options = [
      { label: 'Sin filtro (reset)', value: 'off', emoji: '❌', description: 'Quita todos los filtros' },
      ...FILTER_NAMES.map(f => ({ label: filterLabel(f) || f, value: f, emoji: EMO[f] || '🎛️', description: `Aplicar ${filterLabel(f) || f}`.slice(0, 90) })),
    ].slice(0, 25)

    const menu = new StringSelectMenuBuilder().setCustomId('fx_select').setPlaceholder('🎛️ Elige un filtro…').addOptions(options)
    const render = () => new EmbedBuilder().setColor(0x00ff33)
      .setAuthor({ name: 'Filtros de Audio', iconURL: client.user.displayAvatarURL() })
      .setDescription(`Filtro actual: **${filterLabel(state.filter) || 'Ninguno'}**\nElige uno en el menú de abajo para aplicarlo al instante.`)

    const sent = await message.reply({ embeds: [render()], components: [new ActionRowBuilder().addComponents(menu)] }).catch(() => null)
    if (!sent) return

    const collector = sent.createMessageComponentCollector({ time: 120000 })
    collector.on('collect', async i => {
      if (i.user.id !== message.author.id) return i.reply({ content: 'Este menú no es tuyo.', ephemeral: true }).catch(() => {})
      const f = i.values[0]
      await client.music.setFilter(message.guild.id, f).catch(() => {})
      state.filter = f === 'off' ? 'none' : f
      await i.update({ embeds: [render()], components: [new ActionRowBuilder().addComponents(menu)] }).catch(() => {})
    })
    collector.on('end', () => sent.edit({ components: [] }).catch(() => {}))
  },
}
