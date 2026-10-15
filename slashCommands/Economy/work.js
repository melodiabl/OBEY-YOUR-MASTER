const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const { ensure_economy_user, nFormatter, duration } = require('../../handlers/functions')

const COOLDOWN = 25 * 60 * 1000
const JOBS = ['Programador','Constructor','Mesero','Chef','Mecánico','Abogado','Médico','Diseñador','Músico','Streamer','Gamer','Moderador','Astronauta','Detective','Bombero']

module.exports = {
  name: 'work',
  description: 'Trabajar para ganar monedas',
  options: [],

  run: async (client, interaction) => {
    if (!client.settings.get(interaction.guild.id, 'ECONOMY'))
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription(obeyUi.limit(obeyUi.owned('❌ El sistema de economía no está activado.'), 4096))], ephemeral: true })

    const uid = interaction.user.id
    const gid = interaction.guild.id
    ensure_economy_user(client, gid, uid)
    const data = client.economy.get(`${gid}-${uid}`)

    const remaining = COOLDOWN - (Date.now() - (data.work || 0))
    if (data.work !== 0 && remaining > 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setTitle(obeyUi.limit(obeyUi.owned('⏳ Todavía estás trabajando'), 256))
          .setDescription(obeyUi.limit(`Descansa **${duration(remaining)}** más`, 4096))],
        ephemeral: true,
      })
    }

    const job    = JOBS[Math.floor(Math.random() * JOBS.length)]
    const boost  = data.black_market?.boost?.multiplier || 1
    const amount = Math.floor((Math.floor(Math.random() * 151) + 50) * boost)

    client.economy.math(`${gid}-${uid}`, '+', amount, 'balance')
    client.economy.set(`${gid}-${uid}`, Date.now(), 'work')
    const newBal = client.economy.get(`${gid}-${uid}`, 'balance')

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(0x3B82F6)
        .setTitle(obeyUi.limit(obeyUi.owned('💼 Trabajo completado'), 256))
        .setDescription(obeyUi.limit(`Trabajaste como **${job}** y ganaste **${nFormatter(amount)}** ${obeyUi.markup("icon.coins")}`, 4096))
        .addFields({ name: obeyUi.owned('💰 Balance actual'), value: `**${nFormatter(newBal)}** ${obeyUi.markup("icon.coins")}`, inline: true })
        .setFooter(obeyMeta.asFooter({ text: 'Cooldown: 25 minutos' }))],
    })
  },
}
