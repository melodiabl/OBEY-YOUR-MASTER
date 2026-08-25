const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter } = require('../../handlers/functions')

module.exports = {
  name: 'depositar',
  description: 'Depositar monedas en el banco',
  options: [
    { String: { name: 'cantidad', description: 'Cantidad a depositar o "todo"', required: true } },
  ],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'ECONOMY'))
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de economía no está activado.')], ephemeral: true })

    const uid = interaction.user.id
    const gid = interaction.guild.id
    ensure_economy_user(client, gid, uid)

    const bal   = client.economy.get(`${gid}-${uid}`, 'balance') ?? 0
    const input = interaction.options.getString('cantidad').toLowerCase()
    const amount = input === 'todo' || input === 'all' ? bal : parseInt(input)

    if (isNaN(amount) || amount < 1)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Cantidad inválida.')], ephemeral: true })
    if (bal < amount)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ No tienes suficiente. Cartera: **${nFormatter(bal)}** 🪙`)], ephemeral: true })

    client.economy.math(`${gid}-${uid}`, '-', amount, 'balance')
    client.economy.math(`${gid}-${uid}`, '+', amount, 'bank')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x3B82F6)
        .setTitle('🏦 Depósito realizado')
        .addFields(
          { name: '💰 Depositado', value: `**${nFormatter(amount)}** 🪙`,                                      inline: true },
          { name: '👛 Cartera',    value: `**${nFormatter(client.economy.get(`${gid}-${uid}`, 'balance'))}** 🪙`, inline: true },
          { name: '🏦 Banco',      value: `**${nFormatter(client.economy.get(`${gid}-${uid}`, 'bank'))}** 🪙`,   inline: true },
        )],
    })
  },
}
