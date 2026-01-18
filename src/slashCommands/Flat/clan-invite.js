const { SlashCommandBuilder } = require('discord.js')
const { inviteToClan } = require('../../systems').clans
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'clans',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('clan-invite')
    .setDescription('Invita a un usuario a tu clan (solo dueno)')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario a invitar')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario', true)
    if (target.bot) return interaction.reply({ content: 'No puedes invitar bots.', ephemeral: true })
    try {
      await inviteToClan({ client, guildID: interaction.guild.id, inviterID: interaction.user.id, targetID: target.id })
      return interaction.reply({ content: `✅ Invitacion enviada a <@${target.id}>.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
