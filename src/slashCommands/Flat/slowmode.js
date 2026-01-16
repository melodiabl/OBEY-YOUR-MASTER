const { SlashCommandBuilder } = require('discord.js')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

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
    if (!channel?.setRateLimitPerUser) return interaction.reply({ content: 'Este canal no soporta slowmode.', ephemeral: true })
    await channel.setRateLimitPerUser(seconds, `slowmode por ${interaction.user.id}`).catch((e) => { throw e })
    return interaction.reply({ content: `✅ Slowmode actualizado a **${seconds}s**.`, ephemeral: true })
  }
}

