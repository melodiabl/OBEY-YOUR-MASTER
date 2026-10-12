const fs = require('node:fs/promises')
const { loadImage } = require('@napi-rs/canvas')
const { contract, assetPath, selectedAsset, canonicalKey, emojiName, snowflake } = require('./registry')
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
async function validateSelectedAssets(keys = contract.selected.uploadPlan.map(entry => entry.key)) {
  if (!Array.isArray(keys) || !keys.length) throw new Error('Select asset keys')
  const plans = new Map(contract.selected.uploadPlan.map(entry => [entry.key, entry]))
  const assets = []
  for (const key of new Set(keys.map(canonicalKey))) {
    const plan = plans.get(key)
    if (!plan) throw new Error(`Asset is not an application emoji: ${key}`)
    const file = selectedAsset(key)
    const buffer = await fs.readFile(file.path)
    const sha256 = createHash('sha256').update(buffer).digest('hex')
    if (sha256 !== file.sha256 || sha256 !== plan.sha256 || buffer.length !== file.bytes) throw new Error(`Asset integrity mismatch: ${key}`)
    let width, height
    if (plan.animated) {
      if (buffer.length < 14 || !['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) throw new Error(`Invalid GIF: ${key}`)
      width = buffer.readUInt16LE(6); height = buffer.readUInt16LE(8)
    } else {
      if (buffer.length < 33 || !buffer.subarray(0, 8).equals(signature) || buffer.toString('ascii', 12, 16) !== 'IHDR') throw new Error(`Invalid PNG: ${key}`)
      width = buffer.readUInt32BE(16); height = buffer.readUInt32BE(20)
    }
    if (width !== 128 || height !== 128 || buffer.length > 256 * 1024) throw new Error(`Invalid emoji dimensions/weight: ${key}`)
    const image = await loadImage(buffer)
    if (image.width !== width || image.height !== height) throw new Error(`Emoji decode failed: ${key}`)
    if (file.name !== emojiName(plan.storageKey, sha256) || !/^\w{2,32}$/.test(file.name)) throw new Error(`Invalid emoji name: ${key}`)
    assets.push({ ...file, width, height, sha256, bytes: buffer.length, mapVersion: 2 })
  }
  return assets
}
function planEmojiSync(assets, existing, previous = {}) {
  if (!Array.isArray(existing)) throw new Error('Invalid application emoji list')
  return assets.map(asset => {
    const animated = asset.animated ?? false
    const known = previous.emojis && Object.hasOwn(previous.emojis, asset.key) && previous.emojis[asset.key]
    const byId = known && existing.find(emoji => emoji.id === known.id)
    if (byId && known.sha256 === asset.sha256 && (byId.name !== asset.name || byId.animated !== animated)) throw new Error(`Application emoji collision: ${asset.key}`)
    const matches = existing.filter(emoji => emoji.name === asset.name)
    if (matches.length > 1) throw new Error(`Ambiguous application emoji: ${asset.key}`)
    const match = matches[0]
    if (match && (!snowflake(match.id) || match.animated !== animated || match.available === false)) throw new Error(`Invalid application emoji: ${asset.key}`)
    if (byId && known.sha256 === asset.sha256 && match?.id !== byId.id) throw new Error(`Application emoji collision: ${asset.key}`)
    return { ...asset, animated, action: match ? 'reuse' : 'create', id: match?.id }
  })
}
async function syncEmojis({ assets, applicationId, adapter, save, previous = {} }) {
  if (!snowflake(applicationId)) throw new Error('Invalid application ID')
  if (!Array.isArray(assets) || !assets.length || new Set(assets.map(asset => asset.key)).size !== assets.length) throw new Error('Select unique asset keys')
  const version = assets[0].mapVersion ?? 1
  if (![1, 2].includes(version)) throw new Error('Invalid emoji map version')
  if (assets.some(asset => (asset.mapVersion ?? 1) !== version)) throw new Error('Cannot mix emoji map versions')
  previous = previous && previous.applicationId === applicationId && [1, 2].includes(previous.version) ? previous : {}
  if (version === 1 && previous.version === 2) throw new Error('Cannot downgrade a canonical emoji map')
  const existing = await adapter.list()
  const plan = planEmojiSync(assets, existing, previous)
  function retained(entries = {}) {
    return Object.fromEntries(Object.entries(entries).filter(([, item]) => item && existing.some(emoji => emoji.id === item.id && emoji.name === item.name && emoji.animated === item.animated && emoji.available !== false)))
  }
  const map = { version, applicationId, emojis: retained(previous.version === version ? previous.emojis : {}) }
  if (version === 2) {
    map.legacyEmojis = retained(previous.version === 1 ? previous.emojis : previous.legacyEmojis)
    map.failures = { ...(previous.version === 2 ? previous.failures : {}) }
  }
  for (const item of plan) {
    let emoji = item.action === 'reuse' ? { id: item.id, name: item.name, animated: item.animated } : null
    if (!emoji) {
      const buffer = await fs.readFile(item.path)
      if (createHash('sha256').update(buffer).digest('hex') !== item.sha256) throw new Error(`Asset changed after validation: ${item.key}`)
      try { emoji = await adapter.create(item.name, buffer, item) }
      catch (error) {
        // A lost response may already have created the emoji. Never blindly repeat POST.
        const reconciled = planEmojiSync([item], await adapter.list(), previous)[0]
        if (reconciled.action === 'reuse') emoji = { id: reconciled.id, name: item.name, animated: item.animated }
        else if (version === 2) {
          map.failures[item.key] = 'upload_failed'
          await save(structuredClone(map))
          continue
        } else throw error
      }
    }
    if (!snowflake(emoji?.id) || emoji.name !== item.name || emoji.animated !== item.animated || emoji.available === false) throw new Error(`Invalid upload response: ${item.key}`)
    map.emojis[item.key] = { id: emoji.id, name: emoji.name, animated: item.animated, sha256: item.sha256 }
    if (version === 2) delete map.failures[item.key]
    await save(structuredClone(map))
  }
  return map
}
module.exports = { validateAssets, validateSelectedAssets, planEmojiSync, syncEmojis }
