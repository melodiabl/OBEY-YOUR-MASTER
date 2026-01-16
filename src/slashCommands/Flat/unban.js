const { SlashCommandBuilder } = require('discord.js')
const { logAction } = require('../../systems/moderation/moderationService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = {
  MODULE: 'moderation',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.MOD_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Quita el ban a un usuario')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario')
        .setRequired(true)
    )
    .addStringOption(o =>
      o
        .setName('razon')
        .setDescription('Razon (opcional)')
        .setRequired(false)
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario', true)
    const reason = interaction.options.getString('razon') || 'Sin razon.'

    await interaction.guild.members.unban(target.id, reason).catch((e) => { throw e })
    const modCase = await logAction({
      guildID: interaction.guild.id,
      type: 'unban',
      targetID: target.id,
      moderatorID: interaction.user.id,
      reason
    })
    return interaction.reply({ content: `✅ Unban aplicado a <@${target.id}>. Caso #${modCase.caseNumber}.`, ephemeral: true })
  }
}

