const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'jump',
  description: 'Salta directamente a una posicion de la cola',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [
    { Integer: { name: 'posicion', description: 'Numero de la cancion en la cola', required: true } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(d)

    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [err('❌ Debes estar en un canal de voz.')], ephemeral: true })
    const pos = interaction.options.getInteger('posicion')
    await interaction.deferReply()
    try {
      const state = client.music.getState(interaction.guild.id)
      const track = state.queue[pos - 1]
      if (!track) return interaction.editReply({ embeds: [err(`❌ No hay ninguna pista en la posición **${pos}**.`)] })
      const info = track.info || track
      await client.music.jump(interaction.guild.id, pos)
      await interaction.editReply({ embeds: [ok(`⏭️ Saltando a **${info.title || '?'}** (posición ${pos})`)] })
    } catch (e) {
      await interaction.editReply({ embeds: [err(`❌ ${e.message}`)] })
    }
  },
}
