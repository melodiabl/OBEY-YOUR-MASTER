const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'remove',
  description: 'Elimina una cancion de la cola',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [
    { Integer: { name: 'posicion', description: 'Numero de la cancion a eliminar', required: true } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(d, 4096))

    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [err(obeyUi.owned('❌ Debes estar en un canal de voz.'))], ephemeral: true })
    const pos = interaction.options.getInteger('posicion')
    await interaction.deferReply()
    try {
      const removed = await client.music.remove(interaction.guild.id, pos)
      const info = removed?.info || removed
      await interaction.editReply({ embeds: [ok(`${obeyUi.markup("icon.delete")} Eliminado de la cola: **${info?.title || '?'}**`)] })
    } catch (e) {
      await interaction.editReply({ embeds: [err(`${obeyUi.markup("icon.error")} ${e.message}`)] })
    }
  },
}
