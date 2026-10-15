const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
function fmtMs(ms){const s=Math.floor((ms||0)/1000);return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
module.exports = {
  name: 'forward', description: 'Avanza la cancion X segundos',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ Integer: { name: 'segundos', description: 'Segundos a avanzar (default 30)', required: false } }],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Debes estar en un canal de voz.'), 4096))], ephemeral: true })
    await interaction.deferReply()
    try {
      const sec = Math.max(1, interaction.options.getInteger('segundos') || 30)
      const player = client.shoukaku?.players?.get(interaction.guild.id)
      if (!player) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay reproductor activo.'), 4096))] })
      const newPos = (player.position || 0) + sec * 1000
      await player.seekTo(newPos)
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
        .setTitle(obeyUi.limit(obeyUi.owned('⏩ Avanzado'), 256))
        .setDescription(obeyUi.limit(`**+${sec}s** → \`${fmtMs(newPos)}\``, 4096))] })
    } catch (e) { await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} ${e.message}`, 4096))] }) }
  },
}
