const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'shuffle', description: 'Mezcla aleatoriamente la cola',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debes estar en un canal de voz.')], ephemeral: true })
    await interaction.deferReply()
    const enabled = await client.music.shuffle(interaction.guild.id)
    const state   = client.music?.getState(interaction.guild.id)
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(enabled ? 0x1DB954 : 0x5865F2)
      .setTitle(enabled ? '🔀 Mezclar activado' : '➡️ Mezclar desactivado')
      .setDescription(enabled
        ? `La cola se mezcló y las próximas pistas se elegirán al azar${state?.queue?.length ? ` (**${state.queue.length}** en cola)` : ''}.`
        : 'Las pistas volverán a sonar en orden.')] })
  },
}
