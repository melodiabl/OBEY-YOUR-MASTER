const { SlashCommandBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = {
  MODULE: 'levels',
  INTERNAL_ROLE: INTERNAL_ROLES.ADMIN,
  INTERNAL_PERMS: [PERMS.LEVELS_XP],
  CMD: new SlashCommandBuilder()
    .setName('level-reset')
    .setDescription('Resetea nivel y xp de un usuario')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario')
        .setRequired(true)
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario', true)
    await UserSchema.findOneAndUpdate(
      { userID: target.id },
      { $setOnInsert: { userID: target.id }, $set: { level: 1, xp: 0 } },
      { upsert: true, new: true }
    )
    return interaction.reply({ content: `✅ Nivel de <@${target.id}> reseteado.`, ephemeral: true })
  }
}
