const { SlashCommandBuilder } = require('discord.js')
const { acceptInvite } = require('../../systems/clans/clanService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'clans',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('clan-accept')
    .setDescription('Acepta una invitacion de clan pendiente'),

  async execute (client, interaction) {
    try {
      const clan = await acceptInvite({ client, guildID: interaction.guild.id, userID: interaction.user.id })
      return interaction.reply({ content: `✅ Te uniste a **${clan.name}**${clan.tag ? ` [${clan.tag}]` : ''}.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}

