const axios = require('axios')
const FormData = require('form-data')
const { randomBytes } = require('node:crypto')
const { PermissionFlagsBits } = require('discord.js')
const { inspectCardImage } = require('./card-media')

const failure = code => Object.assign(new Error(code), { code })
const textLimit = value => String(value || '').slice(0, 2000).replace(/[\uD800-\uDBFF]$/, '')

// Retry only an explicit rejection, never an uncertain create-message outcome.
async function deliverCardPayload({ payload, filename, render, send, capabilities, mentionUserId }) {
  const base = structuredClone(payload)
  base.content = textLimit(base.content)
  base.embeds ||= []
  for (const embed of base.embeds) for (const key of ['image', 'thumbnail']) {
    if (embed[key]?.url?.startsWith('attachment://')) delete embed[key]
  }
  base.allowed_mentions = { parse: [], users: /^\d{16,20}$/.test(mentionUserId || '') ? [mentionUserId] : [] }
  base.attachments = []
  const initial = await capabilities()
  if (!initial.send) throw failure('card_delivery_denied')
  let buffer = null, reason = initial.attach ? null : 'attachments_unavailable'
  if (initial.attach) {
    try {
      buffer = await render()
      if (inspectCardImage(buffer).type !== 'image/png') throw failure('invalid_card_image')
    } catch { buffer = null; reason = 'render_failed' }
  }
  let lastHadImage = false
  async function attempt(image) {
    const current = await capabilities()
    if (!current.send) throw failure('card_delivery_denied')
    const output = structuredClone(base)
    if (!current.attach && image) { image = null; reason = 'attachments_unavailable' }
    if (!current.embed) {
      output.content = textLimit([base.content, ...base.embeds.flatMap(embed => [embed.title, embed.description, ...(embed.fields || []).map(field => `${field.name}: ${field.value}`)])].filter(Boolean).join('\n'))
      output.embeds = []
    }
    if (image) {
      if (output.embeds.length) output.embeds[0].image = { url: `attachment://${filename}` }
      output.attachments = [{ id: 0, filename }]
    }
    lastHadImage = Boolean(image)
    const message = await send({ payload: output, buffer: image })
    return { message, card: Boolean(image), reason }
  }
  try { return await attempt(buffer) }
  catch (error) {
    if (error.code === 'card_delivery_denied') throw error
    if (lastHadImage && [400, 413, 415].includes(error.response?.status)) {
      reason = 'attachment_rejected'
      try { return await attempt(null) } catch (fallbackError) {
        if (fallbackError.code === 'card_delivery_denied') throw fallbackError
      }
    }
    throw failure('card_delivery_failed')
  }
}

async function sendMembershipCard({ client, channel, guildId, recipientId, embed, content = '', kind = 'welcome', render }) {
  if (!['welcome', 'leave'].includes(kind)) throw failure('invalid_card_delivery')
  if (channel && (typeof guildId !== 'string' || channel.guild?.id !== guildId)) throw failure('card_delivery_denied')
  const headers = { Authorization: `Bot ${client.token}` }
  let channelId = channel?.id
  if (!channelId && /^\d{16,20}$/.test(recipientId || '')) {
    try {
      const result = await axios.post('https://discord.com/api/v10/users/@me/channels', { recipient_id: recipientId }, { headers, timeout: 10000 })
      channelId = result.data?.id
    } catch { throw failure('card_delivery_failed') }
  }
  if (!/^\d{16,20}$/.test(channelId || '')) throw failure('invalid_card_delivery')
  const filename = `${kind}-image.png`, nonce = randomBytes(12).toString('hex')
  const capabilities = async () => {
    if (!channel) return { send: true, embed: true, attach: true }
    try {
      const bot = await channel.guild.members.fetchMe({ force: true }), permissions = channel.permissionsFor(bot)
      return { send: Boolean(permissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])),
        embed: Boolean(permissions?.has(PermissionFlagsBits.EmbedLinks)), attach: Boolean(permissions?.has(PermissionFlagsBits.AttachFiles)) }
    } catch { return { send: false, embed: false, attach: false } }
  }
  const send = async ({ payload, buffer }) => {
    payload.nonce = nonce; payload.enforce_nonce = true
    if (!buffer) return (await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, payload, { headers, timeout: 10000 })).data
    const form = new FormData()
    form.append('files[0]', buffer, { filename, contentType: 'image/png' })
    form.append('payload_json', JSON.stringify(payload))
    return (await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`, form, { headers: { ...form.getHeaders(), ...headers }, timeout: 10000 })).data
  }
  const result = await deliverCardPayload({ payload: { content, embeds: [embed.toJSON()] }, filename, render, send, capabilities,
    mentionUserId: kind === 'welcome' ? recipientId : undefined })
  if (result.reason) console.warn(`[Cards] ${kind}: ${result.reason}`)
  return result
}

module.exports = { deliverCardPayload, sendMembershipCard }
