const { SlashCommandBuilder } = require('discord.js')
const { streamCollect } = require('../../systems').economy
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'economy',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('stream-collect')
    .setDescription('Cobra lo generado por tu stream'),

  async execute (client, interaction) {
    try {
      const res = await streamCollect({ client, guildID: interaction.guild.id, userID: interaction.user.id })
      return interaction.reply({ content: `✅ Cobrado: **+${res.earned}**. Total acumulado: **${res.stream.totalEarned}**.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
