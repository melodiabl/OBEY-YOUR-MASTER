const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'loop', description: 'Configura el modo de repeticion',
  parameters: { type: 'music', activeplayer: true, previoussong: false },
  options: [{ StringChoices: { name: 'modo', description: 'Modo de repeticion', required: true,
    choices: [
      { name: 'Desactivado', value: 'none' },
      { name: 'Cancion actual', value: 'track' },
      { name: 'Cola completa', value: 'queue' },
    ],
  }}],
  run: async (client, interaction) => {
    if (!interaction.member?.voice?.channel)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Debes estar en un canal de voz.')], ephemeral: true })
    await interaction.deferReply()
    const mode = interaction.options.getString('modo')
    client.music?.setLoop(interaction.guild.id, mode)
    const info = {
      none:  { emoji: '➡️', label: 'Loop desactivado',       desc: 'La cola terminará normalmente.',                  color: 0x4f545c },
      track: { emoji: '🔂', label: 'Repitiendo canción',      desc: 'La canción actual se repetirá indefinidamente.',  color: 0x57F287 },
      queue: { emoji: '🔁', label: 'Repitiendo cola completa', desc: 'La cola completa se repetirá en bucle.',         color: 0x5865F2 },
    }
    const i = info[mode] || info.none
    await interaction.editReply({ embeds: [new EmbedBuilder().setColor(i.color)
      .setTitle(`${i.emoji} ${i.label}`)
      .setDescription(i.desc)] })
  },
}
