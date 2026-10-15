const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'autoplay', description: 'Activa o desactiva el autoplay de canciones similares',
  parameters: { type: 'music', activeplayer: false, previoussong: false },
  options: [{ StringChoices: { name: 'estado', description: 'Activar o desactivar autoplay', required: false,
    choices: [{ name: 'Activar', value: 'on' }, { name: 'Desactivar', value: 'off' }] } }],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Debes estar en un canal de voz.'), 4096))], ephemeral: true })
    await interaction.deferReply()
    const state = client.music?.getState(interaction.guild.id)
    if (!state) return interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No hay sesión de música activa.'), 4096))] })
    const raw = interaction.options.getString('estado')
    const target = raw ? raw === 'on' : !state.autoplay
    state.autoplay = target
    await interaction.editReply({ embeds: [new EmbedBuilder()
      .setColor(target ? 0x57F287 : 0x4f545c)
      .setTitle(obeyUi.limit(target ? obeyUi.owned('🎲 Autoplay activado') : obeyUi.owned('🔇 Autoplay desactivado'), 256))
      .setDescription(obeyUi.limit(target
        ? 'Cuando la cola termine, buscaré canciones similares automáticamente.'
        : 'La música se detendrá cuando la cola esté vacía.', 4096))] })
  },
}
