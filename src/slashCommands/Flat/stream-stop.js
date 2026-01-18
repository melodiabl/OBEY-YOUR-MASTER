const { SlashCommandBuilder } = require('discord.js')
const { streamStop } = require('../../systems').economy
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'economy',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('stream-stop')
    .setDescription('Detiene tu stream (y cobra lo pendiente)'),

  async execute (client, interaction) {
    try {
      const res = await streamStop({ client, guildID: interaction.guild.id, userID: interaction.user.id })
      return interaction.reply({ content: `✅ Stream detenido. Cobrado: **+${res.earned}**. Total: **${res.stream.totalEarned}**.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
