const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const ms = require('ms')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyError, replyOk, replyWarn } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Silencia a un usuario temporalmente')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario a silenciar')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('duracion')
        .setDescription('Duración (ej: 10m, 1h, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('razon')
        .setDescription('Razón del silencio')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute (client, interaction) {
    const target = interaction.options.getMember('usuario')
    const durationStr = interaction.options.getString('duracion')
    const reason = interaction.options.getString('razon') || 'No se proporcionó una razón.'

    if (!target) {
      return replyError(client, interaction, { system: 'moderation', reason: 'El usuario no está en el servidor.' }, { ephemeral: true })
    }
    if (target.user.bot) {
      return replyWarn(client, interaction, { system: 'moderation', title: 'Acción inválida', lines: ['No puedes silenciar a un bot.'] }, { ephemeral: true })
    }

    const duration = ms(durationStr)
    if (!duration || duration < 5000 || duration > 2419200000) {
      return replyError(client, interaction, {
        system: 'moderation',
        reason: 'Duración inválida.',
        hint: 'Usa entre 5s y 28d (ej: 10m, 1h, 1d).'
      }, { ephemeral: true })
    }

    if (!target.manageable || !target.moderatable) {
      return replyError(client, interaction, {
        system: 'moderation',
        reason: 'No tengo permisos suficientes para silenciar a este usuario.',
        hint: 'Revisa jerarquía de roles y permisos del bot.'
      }, { ephemeral: true })
    }

    try {
      await target.timeout(duration, reason)

      await replyOk(client, interaction, {
        system: 'moderation',
        title: 'Timeout aplicado',
        thumbnail: target.user.displayAvatarURL(),
        fields: [
          { name: `${Emojis.member} Usuario`, value: `${target.user.tag} (${Format.inlineCode(target.id)})`, inline: true },
          { name: `${Emojis.loading} Duración`, value: Format.inlineCode(durationStr), inline: true },
          { name: `${Emojis.owner} Moderador`, value: `${interaction.user.tag}`, inline: true },
          { name: `${Emojis.quote} Razón`, value: Format.quote(reason) }
        ]
      })
    } catch (err) {
      return replyError(client, interaction, {
        system: 'moderation',
        reason: `Error al silenciar: ${Format.inlineCode(err.message)}`
      }, { ephemeral: true })
    }
  }
}
