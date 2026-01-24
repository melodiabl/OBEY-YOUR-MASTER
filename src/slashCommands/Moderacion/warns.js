const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed, replyWarn } = require('../../core/ui/interactionKit')

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Muestra las advertencias de un usuario')
    .addUserOption(option =>
      option.setName('usuario')
        .setDescription('El usuario para ver sus advertencias')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('limite')
        .setDescription('Cuántos warns mostrar por página (max 25)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)
    )
    .addIntegerOption(option =>
      option.setName('pagina')
        .setDescription('Página a mostrar')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(50)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute (client, interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user
    const limit = clamp(interaction.options.getInteger('limite') || 12, 1, 25)
    const page = clamp(interaction.options.getInteger('pagina') || 1, 1, 50)

    const userData = await UserSchema.findOne({ userID: target.id }).catch(() => null)
    const warns = Array.isArray(userData?.warns) ? userData.warns : []

    if (!warns.length) {
      return replyWarn(client, interaction, {
        system: 'moderation',
        title: 'Sin advertencias',
        lines: [
          `${Emojis.dot} ${Format.bold(target.tag)} no tiene advertencias.`,
          `${Emojis.dot} Ver ranking del servidor: ${Format.inlineCode('/warns-all')}`
        ],
        signature: 'Historial limpio'
      }, { ephemeral: true })
    }

    const total = warns.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * limit
    const end = Math.min(total, start + limit)

    const rows = warns.slice(start, end).map((w, idx) => {
      const i = start + idx
      const ts = w?.date ? `<t:${Math.floor(new Date(w.date).getTime() / 1000)}:R>` : '—'
      const reason = String(w?.reason || 'Sin razón.').slice(0, 120)
      return `${Emojis.dot} ${Format.bold(`#${i + 1}`)} ${ts}\n${Emojis.dot} Mod: <@${w.moderator}>\n${Emojis.quote} ${Format.italic(reason)}`
    })

    const nextHint = safePage < totalPages
      ? Format.subtext(`Siguiente: ${Format.inlineCode(`/warns pagina:${safePage + 1}`)}`)
      : null

    return replyEmbed(client, interaction, {
      system: 'moderation',
      kind: 'info',
      title: `${Emojis.moderation} Warns`,
      description: [
        headerLine(Emojis.moderation, target.tag),
        `${Emojis.dot} Total: ${Format.inlineCode(total)}`,
        `${Emojis.dot} Página: ${Format.inlineCode(`${safePage}/${totalPages}`)} ${Emojis.dot} Mostrando: ${Format.inlineCode(`${start + 1}-${end}`)}`,
        Format.softDivider(20),
        rows.join('\n\n'),
        nextHint,
        `${Emojis.dot} Servidor: ranking con ${Format.inlineCode('/warns-all')}`
      ].filter(Boolean).join('\n'),
      thumbnail: target.displayAvatarURL({ size: 256 }),
      signature: 'Moderación clara'
    }, { ephemeral: true })
  }
}
