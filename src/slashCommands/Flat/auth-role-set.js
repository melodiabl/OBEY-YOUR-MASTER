const { SlashCommandBuilder } = require('discord.js')
const MemberAuthSchema = require('../../database/schemas/MemberAuthSchema')
const { invalidateIdentityCache } = require('../../core/auth/resolveInternalIdentity')
const { INTERNAL_ROLES, INTERNAL_ROLE_ORDER, isValidInternalRole } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

function roleChoices () {
  return INTERNAL_ROLE_ORDER
    .filter(r => r !== INTERNAL_ROLES.OWNER)
    .map(r => ({ name: r, value: r }))
}

module.exports = {
  INTERNAL_ROLE: INTERNAL_ROLES.ADMIN,
  INTERNAL_PERMS: [PERMS.AUTH_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('auth-role-set')
    .setDescription('Asigna un rol interno a un usuario (override)')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario a modificar')
        .setRequired(true)
    )
    .addStringOption(o =>
      o
        .setName('rol')
        .setDescription('Rol interno')
        .setRequired(true)
        .addChoices(...roleChoices())
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario', true)
    const role = interaction.options.getString('rol', true)
    if (!isValidInternalRole(role) || role === INTERNAL_ROLES.OWNER) {
      return interaction.reply({ content: '❌ Rol interno invalido.', ephemeral: true })
    }

    await MemberAuthSchema.findOneAndUpdate(
      { guildID: interaction.guild.id, userID: target.id },
      { $set: { role } },
      { upsert: true, new: true }
    )

    invalidateIdentityCache({ guildId: interaction.guild.id, userId: target.id })
    return interaction.reply({ content: `✅ Rol interno de <@${target.id}> -> **${role}**.`, ephemeral: true })
  }
}

