const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
// Menú de filtros de audio estilo Soundy: select menu que aplica el filtro al instante.
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')
const { FILTER_NAMES, filterLabel } = require('../../handlers/music/filters')

const EMO = {
  bassboost: obeyUi.owned('🔊'), treblebass: obeyUi.owned('🎚️'), nightcore: obeyUi.owned('⚡'), vaporwave: obeyUi.owned('🌊'), lofi: obeyUi.owned('🎧'),
  slowed: obeyUi.owned('🐢'), crystal: obeyUi.owned('💎'), '8d': obeyUi.owned('🔄'), tremolo: obeyUi.owned('〰️'), vibrato: obeyUi.owned('📳'), metal: obeyUi.owned('🤘'),
  pop: obeyUi.owned('🎵'), soft: obeyUi.owned('☁️'), karaoke: obeyUi.owned('🎤'), normalizar: obeyUi.owned('📊'), eco: obeyUi.owned('🔉'), radio: obeyUi.owned('📻'),
}

module.exports = {
  name: 'filtros',
  category: 'Filter',
  aliases: ['filters', 'filtro', 'fx'],
  description: 'Menú interactivo de filtros de audio (estilo Soundy)',
  usage: 'filtros',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state?.currentTrack) {
      return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay música reproduciéndose.'), 4096))] }).catch(() => {})
    }

    const options = [
      { label: 'Sin filtro (reset)', value: 'off', emoji: obeyUi.component('❌'), description: 'Quita todos los filtros' },
      ...FILTER_NAMES.map(f => ({ label: filterLabel(f) || f, value: f, emoji: obeyUi.component(EMO[f] || '🎛️'), description: `Aplicar ${filterLabel(f) || f}`.slice(0, 90) })),
    ].slice(0, 25)

    const menu = new StringSelectMenuBuilder().setCustomId('fx_select').setPlaceholder(obeyUi.plain('🎛️ Elige un filtro…')).addOptions(options)
    const render = () => new EmbedBuilder().setColor(0x00ff33)
      .setAuthor(obeyMeta.asAuthor({ name: 'Filtros de Audio', iconURL: client.user.displayAvatarURL() }))
      .setDescription(obeyUi.limit(`Filtro actual: **${filterLabel(state.filter) || 'Ninguno'}**\nElige uno en el menú de abajo para aplicarlo al instante.`, 4096))

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
