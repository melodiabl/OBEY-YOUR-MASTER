const { SlashCommandBuilder } = require('discord.js')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

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
    if (!channel?.bulkDelete) return interaction.reply({ content: 'Este canal no soporta purge.', ephemeral: true })

    const deleted = await channel.bulkDelete(amount, true).catch((e) => { throw e })
    return interaction.reply({ content: `✅ Mensajes borrados: **${deleted.size}**.`, ephemeral: true })
  }
}

