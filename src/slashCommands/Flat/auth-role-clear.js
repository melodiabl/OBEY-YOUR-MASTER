const { SlashCommandBuilder } = require('discord.js')
const MemberAuthSchema = require('../../database/schemas/MemberAuthSchema')
const { invalidateIdentityCache } = require('../../core/auth/resolveInternalIdentity')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = {
  INTERNAL_ROLE: INTERNAL_ROLES.ADMIN,
  INTERNAL_PERMS: [PERMS.AUTH_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('auth-role-clear')
    .setDescription('Elimina el override de rol interno de un usuario')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario a modificar')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario', true)
    await MemberAuthSchema.findOneAndUpdate(
      { guildID: interaction.guild.id, userID: target.id },
      { $set: { role: null } },
      { upsert: true, new: true }
    )

    invalidateIdentityCache({ guildId: interaction.guild.id, userId: target.id })
    return interaction.reply({ content: `✅ Override eliminado para <@${target.id}>.`, ephemeral: true })
  }
}

