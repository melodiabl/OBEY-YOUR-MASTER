const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getUserHistory } = require('../../systems/moderation/moderationService')
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')

module.exports = {
  MODULE: 'moderation',
  INTERNAL_ROLE: INTERNAL_ROLES.MOD,
  INTERNAL_PERMS: [PERMS.LOGS_VIEW],
  CMD: new SlashCommandBuilder()
    .setName('mod-history')
    .setDescription('Muestra el historial de moderacion de un usuario')
    .addUserOption(o =>
      o
        .setName('usuario')
        .setDescription('Usuario')
        .setRequired(false)
    )
    .addIntegerOption(o =>
      o
        .setName('limite')
        .setDescription('Max 20')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)
    ),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user
    const limit = interaction.options.getInteger('limite') || 10
    const data = await getUserHistory({ guildID: interaction.guild.id, targetID: target.id, limit })

    if (!data.cases.length) {
      return interaction.reply({ content: `No hay casos para <@${target.id}>. Warns actuales: **${data.warnsCount}**.`, ephemeral: true })
    }

    const lines = data.cases.map(c => {
      const ts = `<t:${Math.floor(new Date(c.createdAt).getTime() / 1000)}:R>`
      return `#${c.caseNumber} \`${c.type}\` ${ts} por <@${c.moderatorID}>`
    })

    const embed = new EmbedBuilder()
      .setTitle(`Historial: ${target.tag}`)
      .setColor('Blurple')
      .setDescription(lines.join('\n'))
      .addFields({ name: 'Warns (UserSchema)', value: String(data.warnsCount), inline: true })
      .setTimestamp()

    return interaction.reply({ embeds: [embed], ephemeral: true })
  }
}

