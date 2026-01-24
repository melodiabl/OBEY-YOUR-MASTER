const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const UserSchema = require('../../database/schemas/UserSchema')
const ModerationCaseSchema = require('../../database/schemas/ModerationCaseSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { headerLine } = require('../../core/ui/uiKit')
const { replyEmbed, replyWarn } = require('../../core/ui/interactionKit')

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

function tsRel (d) {
  const t = new Date(d).getTime()
  if (!Number.isFinite(t) || t <= 0) return '---'
  return `<t:${Math.floor(t / 1000)}:R>`
}

async function renderServerWarns ({ client, interaction, page, limit }) {
  const guildID = interaction.guild.id
  const perPage = clamp(limit || 25, 1, 25)

  const total = await ModerationCaseSchema.countDocuments({ guildID, type: 'warn' }).catch(() => 0)
  if (!total) {
    return replyWarn(client, interaction, {
      system: 'moderation',
      title: 'Sin warns',
      lines: ['No hay warns registrados en este servidor.']
    }, { ephemeral: true })
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = clamp(page || 1, 1, totalPages)
  const skip = (safePage - 1) * perPage

  const rows = await ModerationCaseSchema.find({ guildID, type: 'warn' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(perPage)

  const start = skip + 1
  const end = Math.min(total, skip + rows.length)

  const lines = rows.map((c) => {
    const reason = String(c.reason || 'Sin razon.').slice(0, 120)
    return [
      `${Emojis.dot} ${Format.bold(`#${c.caseNumber}`)} ${tsRel(c.createdAt)} ${Format.inlineCode('warn')}`,
      `${Emojis.dot} Usuario: <@${c.targetID}>  ${Emojis.dot} Mod: <@${c.moderatorID}>`,
      `${Emojis.quote} ${Format.italic(reason)}`
    ].join('\n')
  })

  return replyEmbed(client, interaction, {
    system: 'moderation',
    kind: 'info',
    title: `${Emojis.moderation} Warns`,
    description: [
      headerLine(Emojis.moderation, `${interaction.guild.name} (servidor)`),
      `${Emojis.dot} Total: ${Format.inlineCode(String(total))}`,
      `${Emojis.dot} Pagina: ${Format.inlineCode(`${safePage}/${totalPages}`)} ${Emojis.dot} Mostrando: ${Format.inlineCode(`${start}-${end}`)}`,
      Format.softDivider(20),
      lines.join('\n\n')
    ].join('\n'),
    thumbnail: interaction.guild.iconURL?.({ size: 256 }),
    signature: 'Moderacion trazable'
  }, { ephemeral: true })
}

async function renderUserWarns ({ client, interaction, user, page, limit }) {
  const userData = await UserSchema.findOne({ userID: user.id }).catch(() => null)
  const warns = Array.isArray(userData?.warns) ? userData.warns : []

  if (!warns.length) {
    return replyWarn(client, interaction, {
      system: 'moderation',
      title: 'Sin advertencias',
      lines: [
        `${Emojis.dot} ${Format.bold(user.tag)} no tiene advertencias.`,
        `${Emojis.dot} Para ver el servidor: ${Format.inlineCode('/warns')}`
      ],
      signature: 'Historial limpio'
    }, { ephemeral: true })
  }

  const total = warns.length
  const perPage = clamp(limit || 25, 1, 25)
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = clamp(page || 1, 1, totalPages)
  const startIdx = (safePage - 1) * perPage
  const endIdx = Math.min(total, startIdx + perPage)

  const rows = warns.slice(startIdx, endIdx).map((w, idx) => {
    const i = startIdx + idx
    const reason = String(w?.reason || 'Sin razon.').slice(0, 120)
    return [
      `${Emojis.dot} ${Format.bold(`#${i + 1}`)} ${tsRel(w?.date)} `,
      `${Emojis.dot} Mod: <@${w?.moderator || '0'}>`,
      `${Emojis.quote} ${Format.italic(reason)}`
    ].join('\n')
  })

  return replyEmbed(client, interaction, {
    system: 'moderation',
    kind: 'info',
    title: `${Emojis.moderation} Warns`,
    description: [
      headerLine(Emojis.moderation, user.tag),
      `${Emojis.dot} Total: ${Format.inlineCode(String(total))}`,
      `${Emojis.dot} Pagina: ${Format.inlineCode(`${safePage}/${totalPages}`)} ${Emojis.dot} Mostrando: ${Format.inlineCode(`${startIdx + 1}-${endIdx}`)}`,
      Format.softDivider(20),
      rows.join('\n\n')
    ].join('\n'),
    thumbnail: user.displayAvatarURL({ size: 256 }),
    signature: 'Moderacion clara'
  }, { ephemeral: true })
}

module.exports = {
  CMD: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Sin usuario: warns del servidor. Con usuario: warns de esa persona.')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('Usuario (opcional)')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('limite')
        .setDescription('Cuantos mostrar por pagina (max 25)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)
    )
    .addIntegerOption(option =>
      option
        .setName('pagina')
        .setDescription('Pagina a mostrar')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(50)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute (client, interaction) {
    const userOpt = interaction.options.getUser('usuario')
    const limit = clamp(interaction.options.getInteger('limite') || 25, 1, 25)
    const page = clamp(interaction.options.getInteger('pagina') || 1, 1, 50)

    if (!userOpt) {
      return renderServerWarns({ client, interaction, page, limit })
    }

    return renderUserWarns({ client, interaction, user: userOpt, page, limit })
  }
}
