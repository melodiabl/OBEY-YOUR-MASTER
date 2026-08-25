const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'remove',
  description: 'Elimina una cancion de la cola',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [
    { Integer: { name: 'posicion', description: 'Numero de la cancion a eliminar', required: true } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(d)

    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [err('❌ Debes estar en un canal de voz.')], ephemeral: true })
    const pos = interaction.options.getInteger('posicion')
    await interaction.deferReply()
    try {
      const removed = await client.music.remove(interaction.guild.id, pos)
      const info = removed?.info || removed
      await interaction.editReply({ embeds: [ok(`🗑️ Eliminado de la cola: **${info?.title || '?'}**`)] })
    } catch (e) {
      await interaction.editReply({ embeds: [err(`❌ ${e.message}`)] })
    }
  },
}
