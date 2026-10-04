const fs = require('node:fs/promises')
const { loadImage } = require('@napi-rs/canvas')
const { contract, assetPath, emojiName, snowflake } = require('./registry')
const { createHash } = require('node:crypto')
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
async function validateAssets(keys = Object.keys(contract.icons)) {
  if (!Array.isArray(keys) || !keys.length || new Set(keys).size !== keys.length) throw new Error('Select unique asset keys')
  const assets = []
  for (const key of keys) {
    const buffer = await fs.readFile(assetPath(key))
    if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature) || buffer.toString('ascii', 12, 16) !== 'IHDR') throw new Error(`Invalid PNG: ${key}`)
    const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20)
    if (width !== 128 || height !== 128 || buffer.length > 256 * 1024) throw new Error(`Invalid emoji dimensions/weight: ${key}`)
    const image = await loadImage(buffer)
    if (image.width !== width || image.height !== height) throw new Error(`PNG decode failed: ${key}`)
    const sha256 = createHash('sha256').update(buffer).digest('hex')
    const name = emojiName(key, sha256)
    if (!/^\w{2,32}$/.test(name)) throw new Error(`Invalid emoji name: ${key}`)
    assets.push({ key, path: assetPath(key), width, height, bytes: buffer.length, sha256, name })
  }
  return assets
}
function planEmojiSync(assets, existing) {
  if (!Array.isArray(existing)) throw new Error('Invalid application emoji list')
  return assets.map(asset => {
    const matches = existing.filter(emoji => emoji.name === asset.name)
    if (matches.length > 1) throw new Error(`Ambiguous application emoji: ${asset.key}`)
    const match = matches[0]
    if (match && (!snowflake(match.id) || match.animated !== false)) throw new Error(`Invalid application emoji: ${asset.key}`)
    return { ...asset, action: match ? 'reuse' : 'create', id: match?.id }
  })
}
async function syncEmojis({ assets, applicationId, adapter, save, previous = {} }) {
  if (!snowflake(applicationId)) throw new Error('Invalid application ID')
  const map = { version: 1, applicationId, emojis: previous.applicationId === applicationId && previous.version === 1 ? { ...previous.emojis } : {} }
  const plan = planEmojiSync(assets, await adapter.list())
  for (const item of plan) {
    let emoji = item.action === 'reuse' ? { id: item.id, name: item.name, animated: false } : null
    if (!emoji) {
      const buffer = await fs.readFile(item.path)
      if (createHash('sha256').update(buffer).digest('hex') !== item.sha256) throw new Error(`Asset changed after validation: ${item.key}`)
      try { emoji = await adapter.create(item.name, buffer) }
      catch (error) {
        // A lost response may already have created the emoji. Never blindly repeat POST.
        const reconciled = planEmojiSync([item], await adapter.list())[0]
        if (reconciled.action !== 'reuse') throw error
        emoji = { id: reconciled.id, name: item.name, animated: false }
      }
    }
    if (!snowflake(emoji?.id) || emoji.name !== item.name || emoji.animated !== false) throw new Error(`Invalid upload response: ${item.key}`)
    map.emojis[item.key] = { id: emoji.id, name: emoji.name, animated: false, sha256: item.sha256 }
    await save(map)
  }
  return map
}
module.exports = { validateAssets, planEmojiSync, syncEmojis }
