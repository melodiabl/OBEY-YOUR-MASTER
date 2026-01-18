const { SlashCommandBuilder } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')
const { logAction } = require('../../systems').moderation
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = {
  MODULE: 'moderation',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.MOD_WARN],
  CMD: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Elimina todos los warns de un usuario')
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
    if (target.bot) return interaction.reply({ content: 'Los bots no tienen warns.', ephemeral: true })

    const doc = await UserSchema.findOne({ userID: target.id })
    const removed = Array.isArray(doc?.warns) ? doc.warns.length : 0

    await UserSchema.findOneAndUpdate(
      { userID: target.id },
      { $setOnInsert: { userID: target.id }, $set: { warns: [] } },
      { upsert: true, new: true }
    )

    const modCase = await logAction({
      guildID: interaction.guild.id,
      type: 'clearwarns',
      targetID: target.id,
      moderatorID: interaction.user.id,
      reason,
      meta: { removed }
    })

    return interaction.reply({ content: `✅ Warns eliminados: **${removed}**. Caso #${modCase.caseNumber}.`, ephemeral: true })
  }
}
