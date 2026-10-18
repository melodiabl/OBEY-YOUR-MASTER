const { z } = require('zod')
const { Colors } = require('discord.js')
const { randomInt } = require('node:crypto')
const { COMMAND_CATEGORY_KEYS } = require('./command-policy')

function parseColor(input) {
  if (Number.isInteger(input) && input >= 0 && input <= 0xffffff) return input
  if (typeof input !== 'string') return null
  const value = input.trim()
  if (/^random$/i.test(value)) return randomInt(0x1000000)
  if (/^#[0-9a-f]{3}$/i.test(value)) return parseInt(value.slice(1).split('').map(c => c + c).join(''), 16)
  if (/^(?:#|0x)[0-9a-f]{6}$/i.test(value)) return parseInt(value.replace(/^(?:#|0x)/i, ''), 16)
  const key = Object.keys(Colors).find(key => key.toLowerCase() === value.replace(/[_ -]/g, '').toLowerCase())
  return key ? Colors[key] : null
}
const color = z.union([z.string().max(80), z.number().int()]).transform((value, ctx) => {
  const result = parseColor(value)
  if (result === null) { ctx.addIssue({ code: 'custom', message: 'invalid_color' }); return z.NEVER }
  return result
})
const image = z.string().max(2048).refine(value => {
  if (!value) return true
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password } catch { return false }
})
const EMBED_FIELDS = {
  color: { path: 'embed.color', default: '#fffff9', schema: color },
  footericon: { path: 'embed.footericon', default: '', schema: image },
  footertext: { path: 'embed.footertext', default: '', schema: z.string().max(2048) },
  thumb: { path: 'embed.thumb', default: false, schema: z.boolean() },
}
const COMMAND_FLAGS = COMMAND_CATEGORY_KEYS
const COMMAND_FIELDS = Object.fromEntries(COMMAND_FLAGS.map(id => [id, { path: id, default: true, schema: z.boolean() }]))

module.exports = { EMBED_FIELDS, COMMAND_FLAGS, COMMAND_FIELDS, parseColor }
