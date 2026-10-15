const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
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
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ El sistema de economía no está activado.'), 4096))], ephemeral: true })

    const uid = interaction.user.id
    const gid = interaction.guild.id
    ensure_economy_user(client, gid, uid)
    const data = client.economy.get(`${gid}-${uid}`)

    const remaining = COOLDOWN - (Date.now() - (data.daily || 0))
    if (data.daily !== 0 && remaining > 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setTitle(obeyUi.limit(obeyUi.owned('⏳ Ya reclamaste tu daily'), 256))
          .setDescription(obeyUi.limit(`Vuelve en **${duration(remaining)}**`, 4096))],
        ephemeral: true,
      })
    }

    client.economy.math(`${gid}-${uid}`, '+', AMOUNT, 'balance')
    client.economy.set(`${gid}-${uid}`, Date.now(), 'daily')
    const newBal = client.economy.get(`${gid}-${uid}`, 'balance')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x22C55E)
        .setTitle(obeyUi.limit(obeyUi.owned('✅ Daily reclamado'), 256))
        .setDescription(obeyUi.limit(`Recibiste **${nFormatter(AMOUNT)}** ${obeyUi.markup("icon.coins")}`, 4096))
        .addFields({ name: obeyUi.owned('💰 Balance actual'), value: `**${nFormatter(newBal)}** ${obeyUi.markup("icon.coins")}`, inline: true })
        .setFooter(obeyMeta.asFooter({ text: 'Vuelve mañana para tu próximo daily' }))],
    })
  },
}
