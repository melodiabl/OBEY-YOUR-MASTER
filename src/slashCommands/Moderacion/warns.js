const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed, replyWarn } = require('../../core/ui/interactionKit')

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Muestra las advertencias de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario para ver sus advertencias')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user
    const userData = await UserSchema.findOne({ userID: target.id }).catch(() => null)
    const warns = Array.isArray(userData?.warns) ? userData.warns : []

    if (!warns.length) {
      return replyWarn(client, interaction, {
        system: 'moderation',
        title: 'Sin advertencias',
        lines: [`${Emojis.dot} ${Format.bold(target.tag)} no tiene advertencias.`],
        signature: 'Historial limpio'
      }, { ephemeral: true })
    }

    const rows = warns.slice(0, 12).map((w, i) => {
      const ts = w?.date ? `<t:${Math.floor(new Date(w.date).getTime() / 1000)}:R>` : '—'
      const reason = String(w?.reason || 'Sin razón.').slice(0, 120)
      return `${Emojis.dot} ${Format.bold(`#${i + 1}`)} ${ts}\n${Emojis.dot} Mod: <@${w.moderator}>\n${Emojis.quote} ${Format.italic(reason)}`
    })

    return replyEmbed(client, interaction, {
      system: 'moderation',
      kind: 'info',
      title: `${Emojis.moderation} Warns`,
      description: [
        headerLine(Emojis.moderation, target.tag),
        `${Emojis.dot} Total: ${Format.inlineCode(warns.length)}`,
        Format.softDivider(20),
        rows.join('\n\n'),
        warns.length > 12 ? Format.subtext(`Mostrando 12. Total: ${warns.length}.`) : null
      ].filter(Boolean).join('\n'),
      thumbnail: target.displayAvatarURL({ size: 256 }),
      signature: 'Moderación clara'
    }, { ephemeral: true })
  }
}

