const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'volume', description: 'Ajusta el volumen (0-200)',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ Integer: { name: 'volumen', description: 'Nivel de volumen (0-200)', required: true } }],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debes estar en un canal de voz.')], ephemeral: true })
    await interaction.deferReply()
    const vol = Math.max(0, Math.min(200, interaction.options.getInteger('volumen') || 100))
    const prev = client.music?.getState(interaction.guild.id)?.volume || 100
    await client.music?.setVolume(interaction.guild.id, vol)
    const emoji = vol === 0 ? '🔇' : vol < 40 ? '🔉' : '🔊'
    const bar = '▰'.repeat(Math.round(vol / 10)) + '▱'.repeat(20 - Math.round(vol / 10))
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(0x5865F2)
      .setTitle(`${emoji} Volumen`)
      .setDescription(`${bar}\n\n\`${prev}%\` → **\`${vol}%\`**`)] })
  },
}
