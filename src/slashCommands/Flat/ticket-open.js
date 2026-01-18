const { SlashCommandBuilder } = require('discord.js')
const { openTicket } = require('../../systems').tickets
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'tickets',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('ticket-open')
    .setDescription('Abre un ticket de soporte')
    .addStringOption(o =>
      o
        .setName('tema')
        .setDescription('Tema del ticket (opcional)')
        .setRequired(false)
    ),

  async execute (client, interaction) {
    const topic = interaction.options.getString('tema')
    try {
      const res = await openTicket({ client, guild: interaction.guild, opener: interaction.user, topic })
      return interaction.reply({ content: `✅ Ticket #${res.ticketNumber} creado: <#${res.channel.id}>`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
