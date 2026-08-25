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
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xED4245).setDescription('❌ El sistema de economía no está activado.')], ephemeral: true })

    const uid = interaction.user.id
    const gid = interaction.guild.id
    ensure_economy_user(client, gid, uid)
    const data = client.economy.get(`${gid}-${uid}`)

    const remaining = COOLDOWN - (Date.now() - (data.work || 0))
    if (data.work !== 0 && remaining > 0) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xED4245)
          .setTitle('⏳ Todavía estás trabajando')
          .setDescription(`Descansa **${duration(remaining)}** más`)],
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
        .setTitle('💼 Trabajo completado')
        .setDescription(`Trabajaste como **${job}** y ganaste **${nFormatter(amount)}** 🪙`)
        .addFields({ name: '💰 Balance actual', value: `**${nFormatter(newBal)}** 🪙`, inline: true })
        .setFooter({ text: 'Cooldown: 25 minutos' })],
    })
  },
}
