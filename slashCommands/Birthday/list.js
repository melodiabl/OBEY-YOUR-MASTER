const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
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
    if (!docs.length) return interaction.editReply({ content: obeyUi.owned('❌ No hay cumpleaños registrados en este servidor.') })

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
      return `${isToday ? obeyUi.owned('🎉') : obeyUi.owned('🎂')} **${d.day} de ${MONTHS[d.month]}** — ${name}${isToday ? ' _(¡HOY!)_' : d.diff <= 1 ? ' _(mañana)_' : ''}`
    }))

    const embed = new EmbedBuilder()
      .setColor(0xEB459E)
      .setTitle(obeyUi.limit(`${obeyUi.markup("icon.cake")} Próximos cumpleaños — ${interaction.guild.name}`, 256))
      .setDescription(obeyUi.limit(lines.join('\n'), 4096))
      .setFooter(obeyMeta.asFooter({ text: `${docs.length} registrados en total` }))
      .setTimestamp()
    return interaction.editReply({ embeds: [embed] })
  },
}
