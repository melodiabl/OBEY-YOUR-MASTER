const { EmbedBuilder } = require('discord.js')
const Birthday = require(`${process.cwd()}/database/schemas/BirthdaySchema`)
const MONTHS = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
module.exports = {
  name: 'check',
  description: 'Ver el cumpleaños de un usuario',
  options: [
    { User: { name: 'usuario', description: 'Usuario a consultar', required: false } },
  ],
  run: async (client, interaction) => {
    const target = interaction.options.getUser('usuario') || interaction.user
    const doc = await Birthday.findOne({ userId: target.id, guildId: interaction.guild.id })
    if (!doc) return interaction.reply({ content: `❌ ${target.username} no tiene cumpleaños guardado.`, ephemeral: true })
    const now  = new Date()
    const bday = new Date(now.getFullYear(), doc.month - 1, doc.day)
    if (bday < now) bday.setFullYear(now.getFullYear() + 1)
    const diff    = Math.ceil((bday - now) / 86_400_000)
    const isToday = diff === 0 || (doc.day === now.getDate() && doc.month === now.getMonth() + 1)
    const embed = new EmbedBuilder()
      .setColor(0xEB459E)
      .setTitle(`🎂 Cumpleaños de ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ size: 128 }))
      .setDescription(isToday
        ? `🎉 ¡Hoy es su cumpleaños! **${doc.day} de ${MONTHS[doc.month]}**`
        : `📅 **${doc.day} de ${MONTHS[doc.month]}** — en **${diff}** día${diff !== 1 ? 's' : ''}`)
      .setTimestamp()
    return interaction.reply({ embeds: [embed] })
  },
}
