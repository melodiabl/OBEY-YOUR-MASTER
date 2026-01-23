const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const { getUserHistory } = require('../../systems').moderation
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyWarn } = require('../../core/ui/interactionKit')

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
      return replyWarn(client, interaction, {
        system: 'moderation',
        title: 'Sin casos',
        lines: [
          `${Emojis.dot} Usuario: <@${target.id}>`,
          `${Emojis.dot} Warns actuales: ${Format.inlineCode(data.warnsCount)}`
        ],
        signature: 'Historial limpio'
      }, { ephemeral: true })
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
