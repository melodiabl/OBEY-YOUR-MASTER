const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'move',
  description: 'Mueve una cancion a otra posicion en la cola',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [
    { Integer: { name: 'desde', description: 'Posicion actual de la cancion', required: true } },
    { Integer: { name: 'hasta', description: 'Nueva posicion destino',       required: true } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(d, 4096))
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(obeyUi.limit(d, 4096))

    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [err(obeyUi.owned('❌ Debes estar en un canal de voz.'))], ephemeral: true })
    const from = interaction.options.getInteger('desde')
    const to   = interaction.options.getInteger('hasta')
    await interaction.deferReply()
    try {
      const state = client.music.getState(interaction.guild.id)
      const track = state.queue[from - 1]
      if (!track) return interaction.editReply({ embeds: [err(`${obeyUi.markup("icon.error")} No hay pista en la posición **${from}**.`)] })
      await client.music.move(interaction.guild.id, from, to)
      const info = track.info || track
      await interaction.editReply({ embeds: [ok(`${obeyUi.markup("icon.resize")} **${info.title || '?'}** movida de la posición **${from}** a la **${to}**`)] })
    } catch (e) {
      await interaction.editReply({ embeds: [err(`${obeyUi.markup("icon.error")} ${e.message}`)] })
    }
  },
}
