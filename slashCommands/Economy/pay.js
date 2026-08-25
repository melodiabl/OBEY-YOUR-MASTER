const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter } = require('../../handlers/functions')

module.exports = {
  name: 'pay',
  description: 'Transferir monedas a otro usuario',
  options: [
    { User:    { name: 'usuario', description: 'A quién enviar',     required: true } },
    { Integer: { name: 'cantidad', description: 'Cantidad a enviar', required: true } },
  ],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'ECONOMY'))
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de economía no está activado.')], ephemeral: true })

    const target = interaction.options.getUser('usuario')
    const amount = interaction.options.getInteger('cantidad')
    const uid    = interaction.user.id
    const gid    = interaction.guild.id

    if (target.id === uid)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ No puedes enviarte dinero a ti mismo.')], ephemeral: true })
    if (target.bot)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Los bots no pueden recibir dinero.')], ephemeral: true })
    if (amount < 1)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ La cantidad debe ser mayor a 0.')], ephemeral: true })

    ensure_economy_user(client, gid, uid)
    ensure_economy_user(client, gid, target.id)
    const bal = client.economy.get(`${gid}-${uid}`, 'balance') ?? 0

    if (bal < amount)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(`❌ No tienes suficiente dinero. Tienes **${nFormatter(bal)}** 🪙`)],
        ephemeral: true,
      })

    client.economy.math(`${gid}-${uid}`, '-', amount, 'balance')
    client.economy.math(`${gid}-${target.id}`, '+', amount, 'balance')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setTitle('💸 Transferencia realizada')
        .addFields(
          { name: '📤 Enviado a',   value: `${target}`,                                                          inline: true },
          { name: '💰 Cantidad',    value: `**${nFormatter(amount)}** 🪙`,                                       inline: true },
          { name: '👛 Tu balance',  value: `**${nFormatter(client.economy.get(`${gid}-${uid}`, 'balance'))}** 🪙`, inline: true },
        )],
    })
  },
}
