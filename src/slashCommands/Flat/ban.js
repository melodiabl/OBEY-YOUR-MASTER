const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { logAction } = require('../../systems').moderation
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError } = require('../../core/ui/interactionKit')

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

    try {
      const deleteMessageSeconds = Math.max(0, Math.min(7, Number(deleteDays))) * 24 * 60 * 60
      await interaction.guild.members.ban(target.id, { reason, deleteMessageSeconds })

      const modCase = await logAction({
        guildID: interaction.guild.id,
        type: 'ban',
        targetID: target.id,
        moderatorID: interaction.user.id,
        reason,
        meta: { deleteDays }
      })

      const embed = new EmbedBuilder()
        .setTitle(`${Emojis.moderation} Ban Aplicado`)
        .setColor('Red')
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: `${Emojis.member} Usuario`, value: `${target.tag} (${Format.inlineCode(target.id)})`, inline: true },
          { name: `${Emojis.owner} Moderador`, value: `${interaction.user.tag}`, inline: true },
          { name: `${Emojis.id} Caso`, value: Format.inlineCode(`#${modCase.caseNumber}`), inline: true },
          { name: `${Emojis.quote} Razón`, value: Format.quote(reason) }
        )
        .setTimestamp()

      return interaction.reply({ embeds: [embed] })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'moderation',
        title: 'Error al banear',
        reason: e?.message || 'Error desconocido.',
        hint: `${Emojis.dot} Revisa jerarquía de roles y permisos.`
      }, { ephemeral: true })
    }
  }
}
