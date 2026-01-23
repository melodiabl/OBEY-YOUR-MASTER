const { SlashCommandBuilder } = require('discord.js')
const { logAction } = require('../../systems').moderation
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { replyError, replyOk } = require('../../core/ui/interactionKit')

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

    try {
      await interaction.guild.members.unban(target.id, reason)

      const modCase = await logAction({
        guildID: interaction.guild.id,
        type: 'unban',
        targetID: target.id,
        moderatorID: interaction.user.id,
        reason
      })

      return replyOk(client, interaction, {
        system: 'moderation',
        title: 'Unban aplicado',
        lines: [
          `Usuario: **${target.tag || target.username}** (\`${target.id}\`)`,
          `Caso: \`#${modCase.caseNumber}\``
        ],
        signature: reason ? `Razon: ${reason}` : undefined
      }, { ephemeral: true })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'moderation',
        reason: 'No pude aplicar el unban.',
        hint: e?.message ? `Detalle: ${e.message}` : undefined
      }, { ephemeral: true })
    }
  }
}
