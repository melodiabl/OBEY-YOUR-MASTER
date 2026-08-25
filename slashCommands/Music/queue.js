const { EmbedBuilder } = require('discord.js')
function fmtMs(ms) { const s=Math.floor((ms||0)/1000),m=Math.floor(s/60),sec=s%60; return `${m}:${String(sec).padStart(2,'0')}` }
module.exports = {
  name: 'queue', description: 'Muestra la cola de reproduccion',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [{ Integer: { name: 'pagina', description: 'Pagina de la cola', required: false } }],
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true })
    const state = client.music?.getState(interaction.guild.id)
    if (!state?.currentTrack) return interaction.editReply({ content: '❌ No hay música reproduciéndose.' })
    const page = Math.max(1, interaction.options.getInteger('pagina') || 1)
    const PER = 10, q = state.queue
    const pages = Math.max(1, Math.ceil(q.length / PER))
    const p = Math.min(page, pages)
    const slice = q.slice((p-1)*PER, p*PER)
    const totalMs = q.reduce((a,t)=>a+(t.info?.length||0),0)
    const cur = state.currentTrack, ci = cur?.info||cur
    const lines = [
      `🎵 **Reproduciendo:** [${ci?.title||'?'}](${ci?.uri||''}) — \`${fmtMs(ci?.length)}\``,
      '',
      ...slice.map((t,i)=>{ const info=t.info||t; return `\`${(p-1)*PER+i+1}.\` [${(info.title||'?').slice(0,50)}](${info.uri||''}) — \`${fmtMs(info.length)}\`` }),
      '',
      `**${q.length}** pistas · Duración total: \`${fmtMs(totalMs)}\``,
    ]
    if (!q.length) lines.splice(1,10,'\n_La cola está vacía_')
    const embed = new EmbedBuilder().setColor(0x5865F2)
      .setTitle(`📋 Cola — página ${p}/${pages}`).setDescription(lines.join('\n'))
      .setFooter({ text: `Página ${p}/${pages}` })
    await interaction.editReply({ embeds: [embed] })
  },
}
