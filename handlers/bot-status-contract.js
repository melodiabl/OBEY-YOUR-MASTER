const { z } = require('zod')
const statusText = z.string().min(1).max(128).refine(value => !/\p{Cc}/u.test(value))
const twitchUrl = z.string().max(200).refine(value => {
  if (value === '') return true
  return /^https:\/\/(?:www\.)?twitch\.tv\/[a-zA-Z0-9_]{1,25}\/?$/i.test(value)
})
const statusFields = { text: statusText, text2: statusText,
  type: z.enum(['PLAYING', 'LISTENING', 'WATCHING', 'STREAMING', 'COMPETING']), url: twitchUrl,
  presence: z.enum(['online', 'idle', 'dnd']) }
const statusSchema = z.strictObject({ ...statusFields, presence: statusFields.presence.default('online') }).refine(value => value.type !== 'STREAMING' || Boolean(value.url))
const statusPatchSchema = z.strictObject(statusFields).partial().refine(value => Object.keys(value).length > 0 && Object.values(value).every(item => item !== undefined))
module.exports = { statusSchema, statusPatchSchema, statusFields }
