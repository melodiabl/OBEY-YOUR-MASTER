const { MAX_IMAGE_BYTES, inspectCardImage } = require('./card-media')
const invalid = () => { throw Object.assign(new Error('invalid_card_job'), { code: 'invalid_card_job' }) }
const keys = ['data', 'avatarBuffer', 'backgroundBuffer', 'accentColor', 'frameColor', 'showAvatar', 'showDiscriminator', 'showMemberCount', 'showServerName', 'isLeave', 'noiseIntensity']

function record(value, allowed) {
  if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) invalid()
  const descriptors = Object.getOwnPropertyDescriptors(value), result = {}
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!allowed.includes(key) || !Object.hasOwn(descriptor, 'value')) invalid()
    result[key] = descriptor.value
  }
  if (Object.getOwnPropertySymbols(value).length) invalid()
  return result
}

function cardJob(kind, input) {
  if (!['welcome', 'leave'].includes(kind)) invalid()
  const fields = record(input, keys)
  const data = record(fields.data || {}, ['username', 'discriminator', 'guildName', 'memberCount'])
  for (const key of ['username', 'discriminator', 'guildName']) {
    if (data[key] !== undefined && (typeof data[key] !== 'string' || data[key].length > 2048)) invalid()
  }
  if (data.memberCount !== undefined && (!Number.isSafeInteger(data.memberCount) || data.memberCount < 0)) invalid()
  const output = { data, isLeave: kind === 'leave' }
  for (const key of ['showAvatar', 'showDiscriminator', 'showMemberCount', 'showServerName', 'isLeave']) {
    if (fields[key] !== undefined && typeof fields[key] !== 'boolean') invalid()
    if (key !== 'isLeave' && fields[key] !== undefined) output[key] = fields[key]
  }
  for (const key of ['accentColor', 'frameColor']) {
    const value = fields[key]
    if (value === undefined || value === null) continue
    if (typeof value !== 'string' || !/^(#[0-9a-f]{6}|white)$/i.test(value)) invalid()
    output[key] = value
  }
  if (fields.noiseIntensity !== undefined) {
    if (typeof fields.noiseIntensity !== 'number' || !Number.isFinite(fields.noiseIntensity) || fields.noiseIntensity < 0 || fields.noiseIntensity > 255) invalid()
    output.noiseIntensity = fields.noiseIntensity
  }
  for (const key of ['avatarBuffer', 'backgroundBuffer']) {
    const value = fields[key]
    if (value === undefined || value === null) continue
    if (!Buffer.isBuffer(value) || value.length > MAX_IMAGE_BYTES) invalid()
    // Malformed optional images become the existing visual fallback in the child.
    output[key] = Buffer.from(value)
  }
  return output
}

function cardResult(buffer) {
  if (!Buffer.isBuffer(buffer) || inspectCardImage(buffer).type !== 'image/png') invalid()
  return buffer
}

module.exports = { cardJob, cardResult }
