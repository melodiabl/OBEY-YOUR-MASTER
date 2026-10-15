const obeyMeta = require("../../handlers/presentation/metadata")
const obeyUi = require("../../handlers/assets/system")
const { EmbedBuilder } = require('discord.js')
const User = require('../../database/schemas/UserSchema')
module.exports = {
  name: 'leaderboard',
  description: 'Ver el top de invitadores del servidor',
  options: [],
  run: async (client, interaction) => {
    await interaction.deferReply()
    const top = await User.find({ guildId: interaction.guild.id, invites: { $gt: 0 } })
      .sort({ invites: -1 })
      .limit(10)

    if (!top.length)
      return interaction.editReply(obeyUi.owned('📋 No hay datos de invitaciones aún en este servidor.'))

    const medals = ['🥇', '🥈', '🥉']
    const lines = top.map((u, i) => {
      const eff = Math.max(0, (u.invites || 0) - (u.fakeInvites || 0) - (u.leftInvites || 0))
      return `${medals[i] || `\`${i + 1}.\``} <@${u.userId}> — **${eff}** invitaciones efectivas`
    })

    const embed = new EmbedBuilder()
      .setTitle(obeyUi.limit(obeyUi.owned('🏆 Top Invitadores'), 256))
      .setColor('#FFD700')
      .setDescription(obeyUi.limit(lines.join('\n'), 4096))
      .setFooter(obeyMeta.asFooter({ text: interaction.guild.name }))
      .setTimestamp()

    await interaction.editReply({ embeds: [embed] })
  },
}
