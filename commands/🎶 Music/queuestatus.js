const { EmbedBuilder } = require('discord.js')
function fmtMs(ms) { const s=Math.floor((ms||0)/1000),m=Math.floor(s/60),sec=s%60; return `${m}:${String(sec).padStart(2,'0')}` }
module.exports = {
  name: 'queuestatus', category: '🎶 Music',
  aliases: ['qs'],
  description: 'Muestra el estado de la cola',
  usage: 'queuestatus',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  run: async (client, message) => {
    const state = client.music?.getState(message.guild.id)
    if (!state?.currentTrack) return message.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay música reproduciéndose.')] }).catch(() => {})
    const ci = state.currentTrack.info || state.currentTrack
    const total = state.queue.reduce((a,t)=>a+(t.info?.length||0),0)
    message.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
      .setTitle('📋 Estado de la cola')
      .addFields(
        { name: '▶️ Reproduciendo', value: ci.title || '?', inline: false },
        { name: '📋 En cola', value: String(state.queue.length), inline: true },
        { name: '⏱ Duración total', value: fmtMs(total), inline: true },
        { name: '🔁 Loop', value: state.loop || 'none', inline: true },
        { name: '🔊 Volumen', value: `${state.volume}%`, inline: true },
        { name: '🎲 Autoplay', value: state.autoplay ? 'Sí' : 'No', inline: true },
      )] }).catch(() => {})
  },
}
