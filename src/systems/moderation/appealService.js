const GuildSchema = require('../../database/schemas/GuildSchema')
const ModerationAppealSchema = require('../../database/schemas/ModerationAppealSchema')
const Emojis = require('../../utils/emojis')
const Format = require('../../utils/formatter')
const { getGuildUiConfig, embed, headerLine } = require('../../core/ui/uiKit')

async function nextAppealNumber (guildID) {
  const doc = await GuildSchema.findOneAndUpdate(
    { guildID },
    { $inc: { appealCounter: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  return doc.appealCounter
}

async function sendAppealToChannel ({ client, guild, guildData, appeal }) {
  const channelId = guildData?.appealsChannel || guildData?.logsChannel || null
  if (!channelId) return false
  const channel = guild.channels.cache.get(channelId)
  if (!channel?.send) return false

  const ui = await getGuildUiConfig(client, guild.id)
  const supportRole = guildData?.appealsSupportRole ? `<@&${guildData.appealsSupportRole}>` : null
  const reason = String(appeal.reason || '').trim()

  const e = embed({
    ui,
    system: 'moderation',
    kind: 'info',
    title: `${Emojis.ticket} ApelaciÃ³n #${appeal.appealNumber}`,
    description: [
      headerLine(Emojis.moderation, 'Nueva apelaciÃ³n'),
      supportRole ? `${Emojis.dot} Ping: ${supportRole}` : null,
      `${Emojis.dot} Usuario: <@${appeal.userID}> ${Format.subtext(appeal.userID)}`,
      `${Emojis.dot} Tipo: ${Format.inlineCode(appeal.type)}`,
      `${Emojis.dot} Estado: ${Format.inlineCode(appeal.status)}`,
      reason ? `${Emojis.quote} ${Format.italic(reason.length > 900 ? reason.slice(0, 899) + 'â€¦' : reason)}` : null,
      `${Emojis.dot} AcciÃ³n staff: ${Format.inlineCode('/appeal list')} ${Emojis.dot} ${Format.inlineCode('/appeal accept')} / ${Format.inlineCode('/appeal reject')}`
    ].filter(Boolean).join('\n'),
    signature: 'Soporte y trazabilidad'
  })

  await channel.send({ embeds: [e] }).catch(() => {})
  return true
}

async function createAppeal ({ client, guild, userID, createdBy, type = 'unknown', reason = null }) {
  const existing = await ModerationAppealSchema.findOne({ guildID: guild.id, userID, status: 'OPEN' }).catch(() => null)
  if (existing) {
    throw new Error(`Ya tienes una apelación abierta: #${existing.appealNumber}`)
  }

  const appealNumber = await nextAppealNumber(guild.id)
  const appeal = await new ModerationAppealSchema({
    guildID: guild.id,
    appealNumber,
    userID,
    createdBy,
    type,
    reason: reason || null,
    status: 'OPEN'
  }).save()

  const guildData = await client.db.getGuildData(guild.id).catch(() => null)
  if (guildData) {
    await sendAppealToChannel({ client, guild, guildData, appeal }).catch(() => {})
  }

  return appeal
}

async function listAppeals ({ guildID, status = 'OPEN', limit = 10 }) {
  const lim = Math.max(1, Math.min(50, Number(limit) || 10))
  const filter = { guildID }
  if (status) filter.status = String(status).toUpperCase()
  return ModerationAppealSchema.find(filter).sort({ createdAt: -1 }).limit(lim)
}

async function setAppealStatus ({ guildID, appealNumber, status, reviewerID, note = null }) {
  const n = Number(appealNumber)
  if (!Number.isFinite(n) || n <= 0) throw new Error('NÃºmero de apelaciÃ³n invÃ¡lido.')
  const st = String(status || '').toUpperCase()
  if (!['OPEN', 'ACCEPTED', 'REJECTED', 'CLOSED'].includes(st)) throw new Error('Estado invÃ¡lido.')

  const appeal = await ModerationAppealSchema.findOne({ guildID, appealNumber: n })
  if (!appeal) throw new Error('No existe esa apelaciÃ³n.')

  appeal.status = st
  appeal.reviewedBy = reviewerID || appeal.reviewedBy
  appeal.reviewedAt = new Date()
  if (note) {
    appeal.notes = Array.isArray(appeal.notes) ? appeal.notes : []
    appeal.notes.push({ by: reviewerID || null, text: String(note).slice(0, 900), createdAt: new Date() })
  }
  await appeal.save()
  return appeal
}

module.exports = {
  createAppeal,
  listAppeals,
  setAppealStatus
}
