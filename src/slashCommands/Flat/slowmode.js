const { SlashCommandBuilder } = require('discord.js')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { replyError, replyOk, replyWarn } = require('../../core/ui/interactionKit')

module.exports = {
  MODULE: 'moderation',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.MOD_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Configura el slowmode del canal actual')
    .addIntegerOption(o =>
      o
        .setName('segundos')
        .setDescription('0-21600')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    ),

  async execute (client, interaction) {
    const seconds = interaction.options.getInteger('segundos', true)
    const channel = interaction.channel

    if (!channel?.setRateLimitPerUser) {
      return replyWarn(client, interaction, {
        system: 'moderation',
        title: 'Canal no compatible',
        lines: ['Este canal no soporta slowmode.']
      }, { ephemeral: true })
    }

    try {
      await channel.setRateLimitPerUser(seconds, `slowmode por ${interaction.user.id}`)
      return replyOk(client, interaction, {
        system: 'moderation',
        title: 'Slowmode actualizado',
        lines: [`Nuevo valor: **${seconds}s**`]
      }, { ephemeral: true })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'moderation',
        reason: 'No pude actualizar el slowmode.',
        hint: e?.message ? `Detalle: ${e.message}` : undefined
      }, { ephemeral: true })
    }
  }
}
