const { SlashCommandBuilder } = require('discord.js')
const { giveRep } = require('../../systems').reputation
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const { replyError } = require('../../utils/interactionUtils')

module.exports = {
  MODULE: 'reputation',
  INTERNAL_ROLE: INTERNAL_ROLES.USER,
  CMD: new SlashCommandBuilder()
    .setName('rep-give')
    .setDescription('Da +1 reputacion a un usuario')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario', true)
    if (target.bot) return interaction.reply({ content: 'No puedes dar rep a bots.', ephemeral: true })
    try {
      const guildData = await client.db.getGuildData(interaction.guild.id)
      const res = await giveRep({
        guildID: interaction.guild.id,
        giverID: interaction.user.id,
        targetID: target.id,
        cooldownMs: guildData.repCooldownMs,
        dailyLimit: guildData.repDailyLimit
      })
      return interaction.reply({ content: `✅ Reputacion dada a <@${target.id}>. Total: **${res.targetRep}**.`, ephemeral: true })
    } catch (e) {
      return replyError(interaction, e?.message || String(e))
    }
  }
}
