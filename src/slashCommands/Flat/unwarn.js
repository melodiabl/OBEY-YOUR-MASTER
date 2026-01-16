const { SlashCommandBuilder } = require('discord.js')
const { unwarnUser } = require('../../systems/moderation/moderationService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = {
  MODULE: 'moderation',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.MOD_WARN],
  CMD: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Quita un warn (ultimo o por indice)')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario')
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o
        .setName('indice')
        .setDescription('Indice (1 = mas viejo)')
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario', true)
    const index = interaction.options.getInteger('indice')
    if (target.bot) return interaction.reply({ content: 'Los bots no tienen warns.', ephemeral: true })

    const res = await unwarnUser({
      guildID: interaction.guild.id,
      targetID: target.id,
      moderatorID: interaction.user.id,
      index
    })

    const extra = index ? ` (indice ${index})` : ' (ultimo)'
    return interaction.reply({
      content: `✅ Warn removido de <@${target.id}>${extra}. Warns restantes: **${res.remaining}**.`,
      ephemeral: true
    })
  }
}

