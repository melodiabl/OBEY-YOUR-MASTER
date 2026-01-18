const { SlashCommandBuilder } = require('discord.js')
const { streamStart } = require('../../systems').economy
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'economy',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('stream-start')
    .setDescription('Inicia un stream (economia)'),

  async execute (client, interaction) {
    try {
      await streamStart({ client, guildID: interaction.guild.id, userID: interaction.user.id })
      return interaction.reply({ content: '✅ Stream iniciado. Usa `stream-collect` para cobrar.', ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
