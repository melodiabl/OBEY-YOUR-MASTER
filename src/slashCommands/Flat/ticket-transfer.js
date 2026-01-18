const { SlashCommandBuilder } = require('discord.js')
const { transferTicket } = require('../../systems').tickets
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  REGISTER: false,
  MODULE: 'tickets',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.TICKETS_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('ticket-transfer')
    .setDescription('Transfiere el claim del ticket a otra persona')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Nuevo staff')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const to = interaction.options.getUser('usuario', true)
    try {
      const t = await transferTicket({
        guildID: interaction.guild.id,
        channelID: interaction.channel.id,
        fromUserID: interaction.user.id,
        toUserID: to.id
      })
      return interaction.reply({ content: `✅ Ticket #${t.ticketNumber} transferido a <@${to.id}>.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
