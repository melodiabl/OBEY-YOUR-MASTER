const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')

module.exports = {
  MODULE: 'levels',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('level-top')
    .setDescription('Leaderboard global de niveles (top 10)'),

  async execute (client, interaction) {
    const rows = await UserSchema.find({}).sort({ level: -1, xp: -1 }).limit(10)
    if (!rows.length) return interaction.reply({ content: 'No hay datos aun.', ephemeral: true })

    const lines = rows.map((u, i) => `#${i + 1} <@${u.userID}> - nivel **${u.level || 1}**, xp **${u.xp || 0}**`)
    const embed = new EmbedBuilder()
      .setTitle('Leaderboard de niveles (global)')
      .setColor('Blurple')
      .setDescription(lines.join('\n'))
      .setTimestamp()
    return interaction.reply({ embeds: [embed], ephemeral: true })
  }
}
