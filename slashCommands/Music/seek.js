const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
function fmtMs(ms){const s=Math.floor((ms||0)/1000);return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
module.exports = {
  name: 'seek', description: 'Salta a un momento de la cancion',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ String: { name: 'tiempo', description: 'Formato: 1:30 o 90 (segundos)', required: true } }],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Debes estar en un canal de voz.'), 4096))], ephemeral: true })
    await interaction.deferReply()
    const raw = interaction.options.getString('tiempo') || ''
    let ms
    if (raw.includes(':')) { const [m, s] = raw.split(':').map(Number); ms = ((m||0)*60+(s||0))*1000 }
    else ms = (parseFloat(raw)||0)*1000
    if (!ms || ms < 0)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Tiempo inválido. Usa `1:30` o `90`.'), 4096))] })
    try {
      const player = client.shoukaku?.players?.get(interaction.guild.id)
      if (!player) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay reproductor activo.'), 4096))] })
      await player.seekTo(ms)
      const state = client.music?.getState(interaction.guild.id)
      const dur = state?.currentTrack?.info?.length || 0
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setTitle(obeyUi.limit(obeyUi.owned('⏩ Posición cambiada'), 256))
        .setDescription(obeyUi.limit(`Saltado a **\`${fmtMs(ms)}\`** ${dur ? `/ \`${fmtMs(dur)}\`` : ''}`, 4096))] })
    } catch (e) { await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} ${e.message}`, 4096))] }) }
  },
}
