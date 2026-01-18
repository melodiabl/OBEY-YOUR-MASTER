const { SlashCommandBuilder } = require('discord.js')
const { listTicketNotes } = require('../../systems').tickets
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  REGISTER: false,
  MODULE: 'tickets',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.TICKETS_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('ticket-note-list')
    .setDescription('Lista notas internas del ticket')
    .addIntegerOption(o =>
      o
        .setName('limite')
        .setDescription('Max 20')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)
    ),

  async execute (client, interaction) {
    const limit = interaction.options.getInteger('limite') || 10
    try {
      const notes = await listTicketNotes({ guildID: interaction.guild.id, channelID: interaction.channel.id, limit })
      if (!notes.length) return interaction.reply({ content: 'No hay notas.', ephemeral: true })
      const lines = notes.map(n => {
        const ts = `<t:${Math.floor(new Date(n.createdAt).getTime() / 1000)}:R>`
        return `${ts} por <@${n.authorID}>: ${n.text}`
      })
      return interaction.reply({ content: lines.join('\n'), ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
