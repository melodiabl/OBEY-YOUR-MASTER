const { EmbedBuilder } = require('discord.js')
const Moderation = require('../../database/schemas/ModerationSchema')
module.exports = {
  name: 'cases',
  description: 'Ver el historial de moderación de un usuario',
  memberpermissions: ['KickMembers'],
  options: [
    { User: { name: 'usuario', description: 'Usuario a consultar', required: true } },
    { Integer: { name: 'pagina', description: 'Página de resultados', required: false } },
  ],
  run: async (client, interaction) => {
    const user = interaction.options.getUser('usuario')
    const page = Math.max(1, interaction.options.getInteger('pagina') || 1)
    const perPage = 8

    const total = await Moderation.countDocuments({ guildId: interaction.guild.id, userId: user.id })
    if (!total)
      return interaction.reply({ content: `📋 ${user} no tiene casos de moderación.`, ephemeral: true })

    const cases = await Moderation.find({ guildId: interaction.guild.id, userId: user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)

    const actionEmoji = { warn: '⚠️', mute: '🔇', kick: '👢', ban: '🔨', timeout: '⏱️' }
    const embed = new EmbedBuilder()
      .setTitle(`📋 Casos de moderación — ${user.username}`)
      .setThumbnail(user.displayAvatarURL())
      .setColor('#FF6B35')
      .setDescription(
        cases.map(c =>
          `${actionEmoji[c.action] || '📌'} **${c.action.toUpperCase()}** — Caso #${c.caseId || c._id.toString().slice(-4)}\n> Razón: ${c.reason} | <t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`
        ).join('\n')
      )
      .setFooter({ text: `Página ${page}/${Math.ceil(total / perPage)} | Total: ${total} casos` })
      .setTimestamp()

    await interaction.reply({ embeds: [embed], ephemeral: true })
  },
}
