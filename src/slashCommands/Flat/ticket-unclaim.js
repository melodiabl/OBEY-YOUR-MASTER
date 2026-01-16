const { SlashCommandBuilder } = require('discord.js')
const { unclaimTicket } = require('../../systems/tickets/ticketService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'tickets',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.TICKETS_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('ticket-unclaim')
    .setDescription('Quita tu claim del ticket del canal actual'),

  async execute (client, interaction) {
    try {
      const t = await unclaimTicket({ guildID: interaction.guild.id, channelID: interaction.channel.id, userID: interaction.user.id })
      return interaction.reply({ content: `✅ Ticket #${t.ticketNumber} ahora esta sin claim.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}

