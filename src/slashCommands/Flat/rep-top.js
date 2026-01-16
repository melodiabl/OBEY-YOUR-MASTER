const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { topRep } = require('../../systems/reputation/reputationService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')

module.exports = {
  MODULE: 'reputation',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('rep-top')
    .setDescription('Leaderboard de reputacion (top 10)'),

  async execute (client, interaction) {
    const rows = await topRep({ guildID: interaction.guild.id, limit: 10 })
    if (!rows.length) return interaction.reply({ content: 'No hay datos aun.', ephemeral: true })
    const lines = rows.map((r, i) => `#${i + 1} <@${r.userID}> - **${r.rep || 0}**`)
    const embed = new EmbedBuilder()
      .setTitle('Leaderboard de reputacion')
      .setColor('Blurple')
      .setDescription(lines.join('\n'))
      .setTimestamp()
    return interaction.reply({ embeds: [embed], ephemeral: true })
  }
}

