const { SlashCommandBuilder } = require('discord.js')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const { replyError, replyOk, replyWarn } = require('../../core/ui/interactionKit')

module.exports = {
  MODULE: 'moderation',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.MOD_MANAGE],
  CMD: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Borra mensajes del canal actual (max 100)')
    .addIntegerOption(o =>
      o
        .setName('cantidad')
        .setDescription('Mensajes a borrar (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute (client, interaction) {
    const amount = interaction.options.getInteger('cantidad', true)
    const channel = interaction.channel

    if (!channel?.bulkDelete) {
      return replyWarn(client, interaction, {
        system: 'moderation',
        title: 'Canal no compatible',
        lines: ['Este canal no soporta purge.']
      }, { ephemeral: true })
    }

    try {
      const deleted = await channel.bulkDelete(amount, true)
      return replyOk(client, interaction, {
        system: 'moderation',
        title: 'Purge completado',
        lines: [`Mensajes borrados: **${deleted.size}**`],
        signature: 'Nota: Discord no borra mensajes muy antiguos'
      }, { ephemeral: true })
    } catch (e) {
      return replyError(client, interaction, {
        system: 'moderation',
        reason: 'No pude borrar los mensajes.',
        hint: e?.message ? `Detalle: ${e.message}` : undefined
      }, { ephemeral: true })
    }
  }
}
