const fs = require('node:fs/promises')
const { createHash } = require('node:crypto')
const { loadImage } = require('@napi-rs/canvas')
const { catalog, assetFor } = require('./production')
async function validateProductionAssets(keys = Object.keys(catalog.entries)) {
  if (!Array.isArray(keys) || !keys.length || new Set(keys).size !== keys.length) throw new Error('Select unique production keys')
  const assets = []
  for (const key of keys) {
    if (!Object.hasOwn(catalog.entries, key)) throw new Error(`Select canonical production key: ${key}`)
    const asset = assetFor(key), buffer = await fs.readFile(asset.path)
    if (createHash('sha256').update(buffer).digest('hex') !== asset.sha256) throw new Error(`Production hash mismatch: ${key}`)
    if (buffer.length > 256 * 1024 || !/^[a-z0-9_]{2,32}$/.test(asset.name)) throw new Error(`Invalid production file: ${key}`)
    const gif = /^GIF8[79]a$/.test(buffer.toString('ascii', 0, 6))
    const png = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    if (asset.animated ? !gif : !png) throw new Error(`Invalid production media type: ${key}`)
    const image = await loadImage(buffer)
    if (image.width !== 128 || image.height !== 128) throw new Error(`Invalid production dimensions: ${key}`)
    assets.push({ ...asset, mapVersion: 2, mimeType: asset.animated ? 'image/gif' : 'image/png', width: 128, height: 128, bytes: buffer.length })
  }
  return assets
}
module.exports = { validateProductionAssets }
