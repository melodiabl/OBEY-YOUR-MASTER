const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'jump',
  description: 'Salta directamente a una posicion de la cola',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [
    { Integer: { name: 'posicion', description: 'Numero de la cancion en la cola', required: true } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(d, 4096))

    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [err(obeyUi.owned('❌ Debes estar en un canal de voz.'))], ephemeral: true })
    const pos = interaction.options.getInteger('posicion')
    await interaction.deferReply()
    try {
      const state = client.music.getState(interaction.guild.id)
      const track = state.queue[pos - 1]
      if (!track) return interaction.editReply({ embeds: [err(`${obeyUi.markup("icon.error")} No hay ninguna pista en la posición **${pos}**.`)] })
      const info = track.info || track
      await client.music.jump(interaction.guild.id, pos)
      await interaction.editReply({ embeds: [ok(`${obeyUi.markup("icon.skip")} Saltando a **${info.title || '?'}** (posición ${pos})`)] })
    } catch (e) {
      await interaction.editReply({ embeds: [err(`${obeyUi.markup("icon.error")} ${e.message}`)] })
    }
  },
}
