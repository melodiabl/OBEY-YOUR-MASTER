const { SlashCommandBuilder } = require('discord.js')
const { logAction } = require('../../systems').moderation
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = {
  MODULE: 'moderation',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.MOD_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea a un usuario del servidor')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario')
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName('borrar_dias')
        .setDescription('Borra mensajes de los ultimos N dias (0-7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7)
    )
    .addStringOption(o =>
      o
        .setName('razon')
        .setDescription('Razon (opcional)')
        .setRequired(false)
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario', true)
    const deleteDays = interaction.options.getInteger('borrar_dias') ?? 0
    const reason = interaction.options.getString('razon') || 'Sin razon.'

    const deleteMessageSeconds = Math.max(0, Math.min(7, Number(deleteDays))) * 24 * 60 * 60
    await interaction.guild.members.ban(target.id, { reason, deleteMessageSeconds }).catch((e) => { throw e })

    const modCase = await logAction({
      guildID: interaction.guild.id,
      type: 'ban',
      targetID: target.id,
      moderatorID: interaction.user.id,
      reason,
      meta: { deleteDays }
    })

    return interaction.reply({ content: `✅ Ban aplicado a <@${target.id}>. Caso #${modCase.caseNumber}.`, ephemeral: false })
  }
}
