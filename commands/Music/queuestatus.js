const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
function fmtMs(ms) { const s=Math.floor((ms||0)/1000),m=Math.floor(s/60),sec=s%60; return `${m}:${String(sec).padStart(2,'0')}` }
module.exports = {
  name: 'queuestatus', category: 'Music',
  aliases: ['qs'],
  description: 'Muestra el estado de la cola',
  usage: 'queuestatus',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state?.currentTrack) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay música reproduciéndose.'), 4096))] }).catch(() => {})
    const ci = state.currentTrack.info || state.currentTrack
    const total = state.queue.reduce((a,t)=>a+(t.info?.length||0),0)
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
      .setTitle(obeyUi.limit(obeyUi.owned('📋 Estado de la cola'), 256))
      .addFields(
        { name: obeyUi.owned('▶️ Reproduciendo'), value: ci.title || '?', inline: false },
        { name: obeyUi.owned('📋 En cola'), value: String(state.queue.length), inline: true },
        { name: obeyUi.owned('⏱ Duración total'), value: fmtMs(total), inline: true },
        { name: obeyUi.owned('🔁 Loop'), value: state.loop || 'none', inline: true },
        { name: obeyUi.owned('🔊 Volumen'), value: `${state.volume}%`, inline: true },
        { name: obeyUi.owned('🎲 Autoplay'), value: state.autoplay ? 'Sí' : 'No', inline: true },
      )] }).catch(() => {})
  },
}
