const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'setlevel',
  description: 'Establecer el nivel de un usuario (admin)',
  memberpermissions: ['Administrator'],
  options: [
    { User:    { name: 'usuario', description: 'Usuario a modificar', required: true } },
    { Integer: { name: 'nivel',   description: 'Nivel a establecer',  required: true } },
    {
      StringChoices: {
        name: 'tipo',
        description: 'Tipo de ranking',
        required: false,
        choices: [['Chat', 'text'], ['Voz', 'voice']],
      },
    },
  ],

  run: async (client, interaction) => {
    const target = interaction.options.getUser('usuario')
    const level  = Math.max(1, interaction.options.getInteger('nivel'))
    const type   = interaction.options.getString('tipo') || 'text'
    const gid    = interaction.guild.id
    const key    = `${gid}-${target.id}`

    if (!client.points?.has(key))
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Ese usuario no tiene datos de ranking.')], ephemeral: true })

    const levelKey = type === 'voice' ? 'voicelevel' : 'level'
    client.points.set(key, level, levelKey)

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setDescription(`✅ **${target.username}** — ${type === 'voice' ? '🎙️ nivel de voz' : '💬 nivel de chat'} establecido a **${level}**.`)],
      ephemeral: true,
    })
  },
}
