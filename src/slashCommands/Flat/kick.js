const { SlashCommandBuilder } = require('discord.js')
const { logAction } = require('../../systems').moderation
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk } = require('../../core/ui/interactionKit')

module.exports = {
  MODULE: 'moderation',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.MOD_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa a un usuario del servidor')
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

    if (!member) {
      return replyError(client, interaction, { system: 'moderation', reason: 'No pude obtener al miembro.' }, { ephemeral: true })
    }

    try {
      await member.kick(reason)

      const modCase = await logAction({
        guildID: interaction.guild.id,
        type: 'kick',
        targetID: target.id,
        moderatorID: interaction.user.id,
        reason
      })

      return replyOk(client, interaction, {
        system: 'moderation',
        title: 'Kick aplicado',
        thumbnail: target.displayAvatarURL(),
        fields: [
          { name: `${Emojis.member} Usuario`, value: `${target.tag} (${Format.inlineCode(target.id)})`, inline: true },
          { name: `${Emojis.owner} Moderador`, value: `${interaction.user.tag}`, inline: true },
          { name: `${Emojis.id} Caso`, value: Format.inlineCode(`#${modCase.caseNumber}`), inline: true },
          { name: `${Emojis.quote} Razón`, value: Format.quote(reason) }
        ]
      })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'moderation',
        reason: `Error al expulsar: ${Format.inlineCode(e.message)}`
      }, { ephemeral: true })
    }
  }
}
