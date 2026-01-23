const { SlashCommandBuilder } = require('discord.js')
const { logAction } = require('../../systems').moderation
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { replyError, replyOk } = require('../../core/ui/interactionKit')

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
    if (!member) return replyError(client, interaction, { system: 'moderation', reason: 'No pude obtener al miembro.' }, { ephemeral: true })

    try {
      await member.timeout(null, reason)

      const modCase = await logAction({
        guildID: interaction.guild.id,
        type: 'untimeout',
        targetID: target.id,
        moderatorID: interaction.user.id,
        reason
      })

      return replyOk(client, interaction, {
        system: 'moderation',
        title: 'Timeout removido',
        lines: [
          `Usuario: **${target.tag || target.username}** (\`${target.id}\`)`,
          `Caso: \`#${modCase.caseNumber}\``
        ],
        signature: reason ? `Razon: ${reason}` : undefined
      }, { ephemeral: true })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'moderation',
        reason: 'No pude remover el timeout.',
        hint: e?.message ? `Detalle: ${e.message}` : undefined
      }, { ephemeral: true })
    }
  }
}
