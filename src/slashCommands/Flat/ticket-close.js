const { SlashCommandBuilder } = require('discord.js')
const { closeTicket } = require('../../systems/tickets/ticketService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'tickets',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.TICKETS_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Cierra el ticket del canal actual'),

  async execute (client, interaction) {
    try {
      const t = await closeTicket({ guildID: interaction.guild.id, channelID: interaction.channel.id, closedBy: interaction.user.id })
      return interaction.reply({ content: `✅ Ticket #${t.ticketNumber} cerrado.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}

