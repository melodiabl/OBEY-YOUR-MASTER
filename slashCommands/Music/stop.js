const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'stop', description: 'Detiene la musica y limpia la cola',
  parameters: { type: 'music', activeplayer: true, previoussong: false }, options: [],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debes estar en un canal de voz.')], ephemeral: true })
    await interaction.deferReply()
    const state = client.music?.getState(interaction.guild.id)
    const count = state?.queue?.length || 0
    await client.music?.stop(interaction.guild.id)
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0xED4245)
      .setTitle('⏹️ Música detenida')
      .setDescription(`Cola limpiada — **${count + 1}** pista${count !== 0 ? 's' : ''} eliminada${count !== 0 ? 's' : ''}.`)] })
  },
}
