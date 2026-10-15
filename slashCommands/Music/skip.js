const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'skip', description: 'Salta la cancion actual',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ Integer: { name: 'cantidad', description: 'Cuantas canciones saltar (default 1)', required: false } }],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Debes estar en un canal de voz.'), 4096))], ephemeral: true })
    await interaction.deferReply()
    const state = client.music?.getState(interaction.guild.id)
    if (!state?.currentTrack)
      return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay música reproduciéndose.'), 4096))] })
    const n = Math.max(1, interaction.options.getInteger('cantidad') || 1)
    const skipped = state.currentTrack?.info?.title || state.currentTrack?.title || '?'
    for (let i = 0; i < n; i++) await client.music.skip(interaction.guild.id)
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
      .setDescription(obeyUi.limit(`${obeyUi.markup("icon.skip")} Saltada **${skipped}**${n > 1 ? ` y ${n - 1} más` : ''}`, 4096))] })
  },
}
