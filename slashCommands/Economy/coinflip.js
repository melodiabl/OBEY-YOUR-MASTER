const obeyUi = require("../../handlers/assets/system")
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
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ El sistema de economía no está activado.'), 4096))], ephemeral: true })

    const choice = interaction.options.getString('lado')
    const bet    = interaction.options.getInteger('apuesta')
    const uid    = interaction.user.id
    const gid    = interaction.guild.id

    if (bet < 1)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ La apuesta debe ser mayor a 0.'), 4096))], ephemeral: true })

    ensure_economy_user(client, gid, uid)
    const bal = client.economy.get(`${gid}-${uid}`, 'balance') ?? 0

    if (bal < bet)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} No tienes suficiente. Tienes **${nFormatter(bal)}** ${obeyUi.markup("icon.coins")}`, 4096))], ephemeral: true })

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
        .setTitle(obeyUi.limit(won ? obeyUi.owned('🎉 ¡Ganaste!') : obeyUi.owned('😢 Perdiste'), 256))
        .addFields(
          { name: obeyUi.owned('🪙 Resultado'), value: result === 'cara' ? obeyUi.owned('🟡 Cara') : obeyUi.owned('⚪ Cruz'), inline: true },
          { name: won ? obeyUi.owned('💰 Ganado') : obeyUi.owned('💸 Perdido'), value: `**${nFormatter(bet)}** ${obeyUi.markup("icon.coins")}`, inline: true },
          { name: obeyUi.owned('👛 Balance'),  value: `**${nFormatter(newBal)}** ${obeyUi.markup("icon.coins")}`, inline: true },
        )],
    })
  },
}
