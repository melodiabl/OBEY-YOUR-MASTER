const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter, duration } = require('../../handlers/functions')

const COOLDOWN   = 60 * 60 * 1000
const MIN_TARGET = 500
const AMOUNTS    = [300,350,400,340,360,350,355,345,365,350,340,360,325,375,312,387]

module.exports = {
  name: 'rob',
  description: 'Robar monedas a otro usuario',
  options: [
    { User: { name: 'usuario', description: 'Usuario a robar', required: true } },
  ],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'ECONOMY'))
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ El sistema de economía no está activado.'), 4096))], ephemeral: true })

    const target = interaction.options.getUser('usuario')
    const uid    = interaction.user.id
    const gid    = interaction.guild.id

    if (target.id === uid)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ No puedes robarte a ti mismo.'), 4096))], ephemeral: true })
    if (target.bot)
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ Los bots no tienen dinero.'), 4096))], ephemeral: true })

    ensure_economy_user(client, gid, uid)
    ensure_economy_user(client, gid, target.id)
    const data  = client.economy.get(`${gid}-${uid}`)
    const data2 = client.economy.get(`${gid}-${target.id}`)

    const remaining = COOLDOWN - (Date.now() - (data.rob || 0))
    if (data.rob !== 0 && remaining > 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setTitle(obeyUi.limit(obeyUi.owned('⏳ Cooldown de robo activo'), 256))
          .setDescription(obeyUi.limit(`Espera **${duration(remaining)}**`, 4096))],
        ephemeral: true,
      })
    }

    if ((data2.balance ?? 0) < MIN_TARGET)
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(`${obeyUi.markup("icon.error")} **${target.username}** tiene menos de ${MIN_TARGET} ${obeyUi.markup("icon.coins")}, no vale la pena.`, 4096))],
        ephemeral: true,
      })

    const boost  = data.black_market?.boost?.multiplier || 1
    const amount = Math.floor(AMOUNTS[Math.floor(Math.random() * AMOUNTS.length)] * boost)

    client.economy.math(`${gid}-${uid}`, '+', amount, 'balance')
    client.economy.math(`${gid}-${target.id}`, '-', amount, 'balance')
    client.economy.set(`${gid}-${uid}`, Date.now(), 'rob')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0xF97316)
        .setTitle(obeyUi.limit(obeyUi.owned('🦹 Robo exitoso'), 256))
        .setDescription(obeyUi.limit(`Le robaste **${nFormatter(amount)}** ${obeyUi.markup("icon.coins")} a **${target.username}**`, 4096))
        .addFields(
          { name: obeyUi.owned('💰 Tu balance'), value: `**${nFormatter(client.economy.get(`${gid}-${uid}`, 'balance'))}** ${obeyUi.markup("icon.coins")}`, inline: true },
        )
        .setFooter(obeyMeta.asFooter({ text: 'Cooldown: 1 hora' }))],
    })
  },
}
