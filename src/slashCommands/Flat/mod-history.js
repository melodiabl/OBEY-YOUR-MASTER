const { SlashCommandBuilder } = require('discord.js')
const { getUserHistory } = require('../../systems').moderation
const { INTERNAL_ROLES } = require('../../core/auth/internalRoles')
const PERMS = require('../../core/auth/permissionKeys')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyWarn } = require('../../core/ui/interactionKit')
const { headerLine } = require('../../core/ui/uiKit')

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
      const reason = String(c.reason || 'Sin razón.').slice(0, 120)
      return [
        `${Emojis.dot} ${Format.bold(`#${c.caseNumber}`)} ${Format.inlineCode(c.type)} ${ts}`,
        `${Emojis.dot} Mod: <@${c.moderatorID}>`,
        `${Emojis.quote} ${Format.italic(reason)}`
      ].join('\n')
    })

    return replyEmbed(client, interaction, {
      system: 'moderation',
      kind: 'info',
      title: `${Emojis.moderation} Historial`,
      description: [
        headerLine(Emojis.moderation, target.tag),
        `${Emojis.dot} Usuario: <@${target.id}> ${Format.subtext(target.id)}`,
        `${Emojis.dot} Warns actuales: ${Format.inlineCode(String(data.warnsCount))}`,
        Format.softDivider(20),
        lines.join('\n\n')
      ].join('\n'),
      thumbnail: target.displayAvatarURL({ size: 256 }),
      signature: `Tip: ${Format.inlineCode('/warns')} ${Emojis.dot} ${Format.inlineCode('/unwarn')}`
    }, { ephemeral: true })
  }
}
