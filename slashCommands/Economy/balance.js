const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter } = require('../../handlers/functions')

module.exports = {
  name: 'balance',
  description: 'Ver tu balance o el de otro usuario',
  options: [
    { User: { name: 'usuario', description: 'Usuario a consultar', required: false } },
  ],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'ECONOMY'))
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de economía no está activado.')], ephemeral: true })

    const target = interaction.options.getUser('usuario') || interaction.user
    if (target.bot)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ Los bots no tienen economía.')], ephemeral: true })

    ensure_economy_user(client, interaction.guild.id, target.id)
    const data = client.economy.get(`${interaction.guild.id}-${target.id}`)

    const bal  = data?.balance ?? 0
    const bank = data?.bank ?? 0

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
        .setTitle('💰 Balance')
        .addFields(
          { name: '👛 Cartera',  value: `**${nFormatter(bal)}** 🪙`,         inline: true },
          { name: '🏦 Banco',    value: `**${nFormatter(bank)}** 🪙`,        inline: true },
          { name: '💎 Total',    value: `**${nFormatter(bal + bank)}** 🪙`,  inline: true },
        )
        .setFooter({ text: interaction.guild.name })],
    })
  },
}
