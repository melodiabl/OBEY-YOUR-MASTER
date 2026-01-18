const { SlashCommandBuilder } = require('discord.js')
const { addTicketNote } = require('../../systems').tickets
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'tickets',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.TICKETS_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('ticket-note-add')
    .setDescription('Agrega una nota interna al ticket')
    .addStringOption(o =>
      o
        .setName('texto')
        .setDescription('Nota')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const text = interaction.options.getString('texto', true)
    try {
      await addTicketNote({ guildID: interaction.guild.id, channelID: interaction.channel.id, authorID: interaction.user.id, text })
      return interaction.reply({ content: '✅ Nota agregada.', ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
