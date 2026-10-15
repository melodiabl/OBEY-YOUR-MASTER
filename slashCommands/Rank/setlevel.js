const obeyUi = require("../../handlers/assets/system")
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
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Ese usuario no tiene datos de ranking.'), 4096))], ephemeral: true })

    const levelKey = type === 'voice' ? 'voicelevel' : 'level'
    client.points.set(key, level, levelKey)

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setDescription(obeyUi.limit(`${obeyUi.markup("icon.success")} **${target.username}** — ${type === 'voice' ? obeyUi.owned('🎙️ nivel de voz') : obeyUi.owned('💬 nivel de chat')} establecido a **${level}**.`, 4096))],
      ephemeral: true,
    })
  },
}
