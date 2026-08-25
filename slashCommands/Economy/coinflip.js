const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter } = require('../../handlers/functions')

module.exports = {
  name: 'coinflip',
  description: 'Apostar monedas en cara o cruz',
  options: [
    {
      StringChoices: {
        name: 'lado',
        description: '¿Cara o Cruz?',
        required: true,
        choices: [
          ['Cara', 'cara'],
          ['Cruz', 'cruz'],
        ],
      },
    },
    { Integer: { name: 'apuesta', description: 'Cantidad a apostar', required: true } },
  ],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'ECONOMY'))
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de economía no está activado.')], ephemeral: true })

    const choice = interaction.options.getString('lado')
    const bet    = interaction.options.getInteger('apuesta')
    const uid    = interaction.user.id
    const gid    = interaction.guild.id

    if (bet < 1)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ La apuesta debe ser mayor a 0.')], ephemeral: true })

    ensure_economy_user(client, gid, uid)
    const bal = client.economy.get(`${gid}-${uid}`, 'balance') ?? 0

    if (bal < bet)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ No tienes suficiente. Tienes **${nFormatter(bal)}** 🪙`)], ephemeral: true })

    const result = Math.random() < 0.5 ? 'cara' : 'cruz'
    const won    = result === choice

    if (won) {
      client.economy.math(`${gid}-${uid}`, '+', bet, 'balance')
    } else {
      client.economy.math(`${gid}-${uid}`, '-', bet, 'balance')
    }

    const newBal = client.economy.get(`${gid}-${uid}`, 'balance')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(won ? 0x22C55E : 0xED4245)
        .setTitle(won ? '🎉 ¡Ganaste!' : '😢 Perdiste')
        .addFields(
          { name: '🪙 Resultado', value: result === 'cara' ? '🟡 Cara' : '⚪ Cruz', inline: true },
          { name: won ? '💰 Ganado' : '💸 Perdido', value: `**${nFormatter(bet)}** 🪙`, inline: true },
          { name: '👛 Balance',  value: `**${nFormatter(newBal)}** 🪙`, inline: true },
        )],
    })
  },
}
