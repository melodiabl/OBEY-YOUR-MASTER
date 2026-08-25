const { EmbedBuilder } = require('discord.js')
const Birthday = require(`${process.cwd()}/database/schemas/BirthdaySchema`)
const MONTHS = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
function daysInMonth(m){ return new Date(2024,m,0).getDate() }
module.exports = {
  name: 'set',
  description: 'Guarda tu fecha de cumpleaños',
  options: [
    { Integer: { name: 'dia',  description: 'Día (1-31)',  required: true  } },
    { Integer: { name: 'mes',  description: 'Mes (1-12)',  required: true  } },
  ],
  run: async (client, interaction) => {
    const err = d => new EmbedBuilder().setColor(0xED4245).setDescription(d)
    const ok  = d => new EmbedBuilder().setColor(0x5865F2).setDescription(d)

    const day   = interaction.options.getInteger('dia')
    const month = interaction.options.getInteger('mes')
    if (!day || !month || day < 1 || day > 31 || month < 1 || month > 12)
      return interaction.reply({ embeds: [err('❌ Fecha inválida.')], ephemeral: true })
    if (day > daysInMonth(month))
      return interaction.reply({ embeds: [err(`❌ El mes ${MONTHS[month]} no tiene ${day} días.`)], ephemeral: true })
    await Birthday.findOneAndUpdate(
      { userId: interaction.user.id, guildId: interaction.guild.id },
      { day, month }, { upsert: true }
    )
    return interaction.reply({ embeds: [ok(`🎂 Cumpleaños guardado: **${day} de ${MONTHS[month]}**`)], ephemeral: true })
  },
}
