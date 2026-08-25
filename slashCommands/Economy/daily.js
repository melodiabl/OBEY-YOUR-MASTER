const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter, duration } = require('../../handlers/functions')

const COOLDOWN = 24 * 60 * 60 * 1000
const AMOUNT   = 500

module.exports = {
  name: 'daily',
  description: 'Reclamar tu recompensa diaria',
  options: [],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'ECONOMY'))
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de economía no está activado.')], ephemeral: true })

    const uid = interaction.user.id
    const gid = interaction.guild.id
    ensure_economy_user(client, gid, uid)
    const data = client.economy.get(`${gid}-${uid}`)

    const remaining = COOLDOWN - (Date.now() - (data.daily || 0))
    if (data.daily !== 0 && remaining > 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setTitle('⏳ Ya reclamaste tu daily')
          .setDescription(`Vuelve en **${duration(remaining)}**`)],
        ephemeral: true,
      })
    }

    client.economy.math(`${gid}-${uid}`, '+', AMOUNT, 'balance')
    client.economy.set(`${gid}-${uid}`, Date.now(), 'daily')
    const newBal = client.economy.get(`${gid}-${uid}`, 'balance')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setTitle('✅ Daily reclamado')
        .setDescription(`Recibiste **${nFormatter(AMOUNT)}** 🪙`)
        .addFields({ name: '💰 Balance actual', value: `**${nFormatter(newBal)}** 🪙`, inline: true })
        .setFooter({ text: 'Vuelve mañana para tu próximo daily' })],
    })
  },
}
