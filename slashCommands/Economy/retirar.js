const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter } = require('../../handlers/functions')

module.exports = {
  name: 'retirar',
  description: 'Retirar monedas del banco a la cartera',
  options: [
    { String: { name: 'cantidad', description: 'Cantidad a retirar o "todo"', required: true } },
  ],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'ECONOMY'))
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de economía no está activado.')], ephemeral: true })

    const uid = interaction.user.id
    const gid = interaction.guild.id
    ensure_economy_user(client, gid, uid)

    const bank  = client.economy.get(`${gid}-${uid}`, 'bank') ?? 0
    const input = interaction.options.getString('cantidad').toLowerCase()
    const amount = input === 'todo' || input === 'all' ? bank : parseInt(input)

    if (isNaN(amount) || amount < 1)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Cantidad inválida.')], ephemeral: true })
    if (bank < amount)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ No tienes suficiente en el banco. Banco: **${nFormatter(bank)}** 🪙`)], ephemeral: true })

    client.economy.math(`${gid}-${uid}`, '+', amount, 'balance')
    client.economy.math(`${gid}-${uid}`, '-', amount, 'bank')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x3B82F6)
        .setTitle('💵 Retiro realizado')
        .addFields(
          { name: '💰 Retirado', value: `**${nFormatter(amount)}** 🪙`,                                         inline: true },
          { name: '👛 Cartera',  value: `**${nFormatter(client.economy.get(`${gid}-${uid}`, 'balance'))}** 🪙`, inline: true },
          { name: '🏦 Banco',    value: `**${nFormatter(client.economy.get(`${gid}-${uid}`, 'bank'))}** 🪙`,    inline: true },
        )],
    })
  },
}
