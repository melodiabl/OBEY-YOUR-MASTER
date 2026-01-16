const { SlashCommandBuilder } = require('discord.js')
const { logAction } = require('../../systems/moderation/moderationService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = {
  MODULE: 'moderation',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.MOD_TIMEOUT],
  CMD: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Quita el timeout a un usuario')
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
    const member = await interaction.guild.members.fetch(target.id).catch(() => null)
    if (!member) return interaction.reply({ content: 'No pude obtener al miembro.', ephemeral: true })

    await member.timeout(null, reason).catch((e) => { throw e })

    const modCase = await logAction({
      guildID: interaction.guild.id,
      type: 'untimeout',
      targetID: target.id,
      moderatorID: interaction.user.id,
      reason
    })

    return interaction.reply({ content: `✅ Timeout removido de <@${target.id}>. Caso #${modCase.caseNumber}.`, ephemeral: true })
  }
}

