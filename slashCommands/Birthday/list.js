const { EmbedBuilder } = require('discord.js')
const Birthday = require(`${process.cwd()}/database/schemas/BirthdaySchema`)
const MONTHS = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
module.exports = {
  name: 'list',
  description: 'Ver los próximos cumpleaños del servidor',
  options: [],
  run: async (client, interaction) => {
    await interaction.deferReply()
    const docs = await Birthday.find({ guildId: interaction.guild.id })
    if (!docs.length) return interaction.editReply({ content: '❌ No hay cumpleaños registrados en este servidor.' })

    const now    = new Date()
    const nowAbs = now.getMonth() * 31 + now.getDate()
    const sorted = docs.map(d => {
      const abs  = (d.month - 1) * 31 + d.day
      const diff = abs >= nowAbs ? abs - nowAbs : (12 * 31 - nowAbs) + abs
      return { ...d.toObject(), diff }
    }).sort((a,b) => a.diff - b.diff).slice(0, 12)

    const lines = await Promise.all(sorted.map(async d => {
      const member = await interaction.guild.members.fetch(d.userId).catch(() => null)
      const name   = member?.user?.username || `<@${d.userId}>`
      const isToday = d.day === now.getDate() && d.month === now.getMonth() + 1
      return `${isToday ? '🎉' : '🎂'} **${d.day} de ${MONTHS[d.month]}** — ${name}${isToday ? ' _(¡HOY!)_' : d.diff <= 1 ? ' _(mañana)_' : ''}`
    }))

    const embed = new EmbedBuilder()
      .setColor(0xEB459E)
      .setTitle(`🎂 Próximos cumpleaños — ${interaction.guild.name}`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `${docs.length} registrados en total` })
      .setTimestamp()
    return interaction.editReply({ embeds: [embed] })
  },
}
