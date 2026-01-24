const UserSchema = require('../../database/schemas/UserSchema')
const ModerationCaseSchema = require('../../database/schemas/ModerationCaseSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { replyEmbed, replyWarn } = require('../../core/ui/messageKit')
const { headerLine } = require('../../core/ui/uiKit')
const { resolveMemberFromArgs } = require('../../core/commands/legacyArgs')

function clamp (n, min, max) {
  const x = Number(n)
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

function tsRel (d) {
  const t = new Date(d).getTime()
  if (!Number.isFinite(t) || t <= 0) return '—'
  return `<t:${Math.floor(t / 1000)}:R>`
}

function parsePaging (tokens) {
  const out = { page: null, limit: null }
  for (const raw of (Array.isArray(tokens) ? tokens : [])) {
    const s = String(raw || '').trim()
    if (!s) continue
    const lower = s.toLowerCase()

    const m = lower.match(/^(page|pagina|p)=(\d{1,3})$/)
    if (m) { out.page = Number(m[2]); continue }
    const l = lower.match(/^(limit|limite|l)=(\d{1,3})$/)
    if (l) { out.limit = Number(l[2]); continue }
  }
  return out
}

async function renderUserWarns ({ client, message, user, page, limit }) {
  const userData = await UserSchema.findOne({ userID: user.id }).catch(() => null)
  const warns = Array.isArray(userData?.warns) ? userData.warns : []

  if (!warns.length) {
    return replyWarn(client, message, {
      system: 'moderation',
      title: 'Sin advertencias',
      lines: [
        `${Emojis.dot} ${Format.bold(user.tag)} no tiene advertencias.`,
        `${Emojis.dot} Servidor: ${Format.inlineCode('warns')} para ver todos los warns del servidor`
      ],
      signature: 'Historial limpio'
    })
  }

  const total = warns.length
  const perPage = clamp(limit || 25, 1, 25)
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = clamp(page || 1, 1, totalPages)
  const start = (safePage - 1) * perPage
  const end = Math.min(total, start + perPage)

  const rows = warns.slice(start, end).map((w, idx) => {
    const i = start + idx
    const ts = w?.date ? tsRel(w.date) : '—'
    const reason = String(w?.reason || 'Sin razón.').slice(0, 120)
    return `${Emojis.dot} ${Format.bold(`#${i + 1}`)} ${ts}\n${Emojis.dot} Mod: <@${w.moderator}>\n${Emojis.quote} ${Format.italic(reason)}`
  })

  const nextHint = safePage < totalPages
    ? Format.subtext(`Siguiente: ${Format.inlineCode(`warns ${user.id} page=${safePage + 1}`)}`)
    : null

  return replyEmbed(client, message, {
    system: 'moderation',
    kind: 'info',
    title: `${Emojis.moderation} Warns`,
    description: [
      headerLine(Emojis.moderation, user.tag),
      `${Emojis.dot} Total: ${Format.inlineCode(total)}`,
      `${Emojis.dot} Página: ${Format.inlineCode(`${safePage}/${totalPages}`)} ${Emojis.dot} Mostrando: ${Format.inlineCode(`${start + 1}-${end}`)}`,
      Format.softDivider(20),
      rows.join('\n\n'),
      nextHint
    ].filter(Boolean).join('\n'),
    thumbnail: user.displayAvatarURL?.({ size: 256 }),
    signature: 'Moderación clara'
  })
}

async function renderServerWarns ({ client, message, page, limit }) {
  const guildID = message.guild.id
  const perPage = clamp(limit || 25, 1, 25)

  const total = await ModerationCaseSchema.countDocuments({ guildID, type: 'warn' }).catch(() => 0)
  if (!total) {
    return replyWarn(client, message, {
      system: 'moderation',
      title: 'Sin warns',
      lines: ['No hay warns registrados en este servidor.']
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = clamp(page || 1, 1, totalPages)
  const skip = (safePage - 1) * perPage

  const rows = await ModerationCaseSchema.find({ guildID, type: 'warn' })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(perPage)

  const lines = rows.map((c) => {
    const reason = String(c.reason || 'Sin razón.').slice(0, 120)
    return [
      `${Emojis.dot} ${Format.bold(`#${c.caseNumber}`)} ${tsRel(c.createdAt)} ${Format.inlineCode('warn')}`,
      `${Emojis.dot} Usuario: <@${c.targetID}>  ${Emojis.dot} Mod: <@${c.moderatorID}>`,
      `${Emojis.quote} ${Format.italic(reason)}`
    ].join('\n')
  })

  const nextHint = safePage < totalPages
    ? Format.subtext(`Siguiente: ${Format.inlineCode(`warns page=${safePage + 1}`)}`)
    : null

  return replyEmbed(client, message, {
    system: 'moderation',
    kind: 'info',
    title: `${Emojis.moderation} Warns (servidor)`,
    description: [
      headerLine(Emojis.moderation, `Página ${safePage}/${totalPages}`),
      `${Emojis.dot} Total: ${Format.inlineCode(total)}`,
      Format.softDivider(20),
      lines.join('\n\n'),
      nextHint
    ].filter(Boolean).join('\n'),
    signature: 'Moderación trazable'
  })
}

module.exports = {
  DESCRIPTION: 'Sin mencionar: muestra warns del servidor. Con usuario: muestra sus warns.',
  ALIASES: ['advertencias', 'warnlist'],
  PERMISSIONS: ['ModerateMembers'],
  async execute (client, message, args) {
    const tokens = Array.isArray(args) ? args.filter(Boolean) : []
    const resolved = tokens.length
      ? await resolveMemberFromArgs({ message, args: tokens, index: 0 }).catch(() => null)
      : null

    if (resolved?.user) {
      const parsed = parsePaging(tokens.slice(1))
      return renderUserWarns({
        client,
        message,
        user: resolved.user,
        page: parsed.page,
        limit: parsed.limit
      })
    }

    // Sin usuario -> servidor (todo el historial).
    const parsed = parsePaging(tokens)
    return renderServerWarns({
      client,
      message,
      page: parsed.page,
      limit: parsed.limit
    })
  }
}
