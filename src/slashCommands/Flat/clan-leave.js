const { SlashCommandBuilder } = require('discord.js')
const { leaveClan } = require('../../systems/clans/clanService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'clans',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('clan-leave')
    .setDescription('Sales de tu clan'),

  async execute (client, interaction) {
    try {
      const clan = await leaveClan({ client, guildID: interaction.guild.id, userID: interaction.user.id })
      return interaction.reply({ content: `✅ Saliste del clan **${clan.name}**.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}

