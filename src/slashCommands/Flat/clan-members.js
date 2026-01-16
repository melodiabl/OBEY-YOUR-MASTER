const { SlashCommandBuilder } = require('discord.js')
const { requireClanByUser } = require('../../systems/clans/clanService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'clans',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('clan-members')
    .setDescription('Lista miembros de tu clan'),

  async execute (client, interaction) {
    try {
      const clan = await requireClanByUser({ client, guildID: interaction.guild.id, userID: interaction.user.id })
      const ids = Array.isArray(clan.memberIDs) ? clan.memberIDs : []
      const lines = ids.slice(0, 50).map(id => `- <@${id}>`)
      return interaction.reply({
        content: `Miembros (**${ids.length}**):\n${lines.join('\n')}${ids.length > 50 ? '\n... (truncado)' : ''}`,
        ephemeral: true
      })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}

