const { EmbedBuilder } = require('discord.js')
function fmtMs(ms){const s=Math.floor((ms||0)/1000);return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
module.exports = {
  name: 'seek', description: 'Salta a un momento de la cancion',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ String: { name: 'tiempo', description: 'Formato: 1:30 o 90 (segundos)', required: true } }],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debes estar en un canal de voz.')], ephemeral: true })
    await interaction.deferReply()
    const raw = interaction.options.getString('tiempo') || ''
    let ms
    if (raw.includes(':')) { const [m, s] = raw.split(':').map(Number); ms = ((m||0)*60+(s||0))*1000 }
    else ms = (parseFloat(raw)||0)*1000
    if (!ms || ms < 0)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Tiempo inválido. Usa `1:30` o `90`.')] })
    try {
      const player = client.shoukaku?.players?.get(interaction.guild.id)
      if (!player) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No hay reproductor activo.')] })
      await player.seekTo(ms)
      const state = client.music?.getState(interaction.guild.id)
      const dur = state?.currentTrack?.info?.length || 0
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setTitle('⏩ Posición cambiada')
        .setDescription(`Saltado a **\`${fmtMs(ms)}\`** ${dur ? `/ \`${fmtMs(dur)}\`` : ''}`)] })
    } catch (e) { await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ ${e.message}`)] }) }
  },
}
