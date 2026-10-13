const https = require('node:https')

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const MAX_IMAGE_SIDE = 4096
const MAX_IMAGE_PIXELS = 8 * 1024 * 1024
const MEDIA_HOSTS = new Set(['cdn.discordapp.com', 'media.discordapp.net'])
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
function failure(code) { return Object.assign(new Error(code), { code }) }

// Inspect dimensions and container boundaries before native decoding. No URLs or paths.
function inspectCardImage(buffer) {
  const invalid = () => { throw failure('invalid_card_image') }
  if (!Buffer.isBuffer(buffer) || buffer.length < 24 || buffer.length > MAX_IMAGE_BYTES) invalid()
  let width, height, type
  if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    if (buffer.length < 33 || buffer.readUInt32BE(8) !== 13 || buffer.toString('ascii', 12, 16) !== 'IHDR') invalid()
    width = buffer.readUInt32BE(16); height = buffer.readUInt32BE(20); type = 'image/png'
    let offset = 8, data = false, end = false
    while (offset + 12 <= buffer.length) {
      const length = buffer.readUInt32BE(offset), chunk = buffer.toString('ascii', offset + 4, offset + 8)
      if (offset + length + 12 > buffer.length || (chunk === 'IHDR' && offset !== 8) || ['acTL', 'fcTL', 'fdAT', 'iCCP', 'zTXt', 'iTXt'].includes(chunk)) invalid()
      if (chunk === 'IDAT') data = true
      offset += length + 12
      if (chunk === 'IEND') { if (length !== 0 || offset !== buffer.length) invalid(); end = true; break }
    }
    if (!data || !end) invalid()
  } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    type = 'image/jpeg'
    let offset = 2
    while (offset + 4 < buffer.length) {
      if (buffer[offset++] !== 0xff) invalid()
      while (buffer[offset] === 0xff) offset++
      const marker = buffer[offset++]
      if ([0xd9, 0xda].includes(marker)) break
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
      if (offset + 2 > buffer.length) invalid()
      const length = buffer.readUInt16BE(offset)
      if (length < 2 || offset + length > buffer.length) invalid()
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        if (length < 8 || width) invalid()
        height = buffer.readUInt16BE(offset + 3); width = buffer.readUInt16BE(offset + 5)
      }
      offset += length
    }
    if (buffer[buffer.length - 2] !== 0xff || buffer[buffer.length - 1] !== 0xd9) invalid()
  } else if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    type = 'image/webp'
    if (buffer.readUInt32LE(4) + 8 !== buffer.length) invalid()
    let offset = 12, imageData = false
    while (offset + 8 <= buffer.length) {
      const chunk = buffer.toString('ascii', offset, offset + 4), length = buffer.readUInt32LE(offset + 4), start = offset + 8
      if (start + length > buffer.length || ['ANIM', 'ANMF'].includes(chunk) || (chunk === 'ICCP' && length > 65536)) invalid()
      if (chunk === 'VP8X') {
        if (length !== 10 || width || (buffer[start] & 2)) invalid()
        width = buffer.readUIntLE(start + 4, 3) + 1; height = buffer.readUIntLE(start + 7, 3) + 1
      } else if (chunk === 'VP8L') {
        if (imageData || length < 5 || buffer[start] !== 0x2f) invalid()
        const dimensions = buffer.readUInt32LE(start + 1)
        if (dimensions >>> 29) invalid()
        const w = (dimensions & 0x3fff) + 1, h = ((dimensions >>> 14) & 0x3fff) + 1
        if (width && (width !== w || height !== h)) invalid()
        width = w; height = h; imageData = true
      } else if (chunk === 'VP8 ') {
        if (imageData || length < 10 || !buffer.subarray(start + 3, start + 6).equals(Buffer.from([0x9d, 0x01, 0x2a]))) invalid()
        const w = buffer.readUInt16LE(start + 6) & 0x3fff, h = buffer.readUInt16LE(start + 8) & 0x3fff
        if (width && (width !== w || height !== h)) invalid()
        width = w; height = h; imageData = true
      }
      offset = start + length + (length & 1)
    }
    if (!imageData || offset !== buffer.length) invalid()
  } else invalid()
  if (!width || !height || width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE || width * height > MAX_IMAGE_PIXELS) invalid()
  return { type, width, height }
}

function cardMediaURL(source) {
  let url
  try { url = new URL(source) } catch { throw failure('invalid_card_media') }
  if (url.protocol !== 'https:' || !MEDIA_HOSTS.has(url.hostname) || url.username || url.password || (url.port && url.port !== '443')) throw failure('invalid_card_media')
  return url
}

function createCardMediaLoader({ request = https.get, timeoutMs = 5000 } = {}) {
  async function load(source) {
    if (Buffer.isBuffer(source)) { inspectCardImage(source); return Buffer.from(source) }
    if (typeof source !== 'string' || source.length > 2048) throw failure('invalid_card_media')
    const url = cardMediaURL(source)
    return new Promise((resolve, reject) => {
      let req, response, settled = false
      const finish = (error, buffer) => {
        if (settled) return
        settled = true; clearTimeout(timer)
        if (error) { response?.destroy(); req?.destroy(); reject(error) } else resolve(buffer)
      }
      const timer = setTimeout(() => finish(failure('card_media_timeout')), timeoutMs)
      try {
        req = request(url, { headers: { Accept: 'image/png,image/jpeg,image/webp', 'Accept-Encoding': 'identity' }, agent: false }, res => {
          response = res
          if (settled) { res.destroy(); return }
          if (res.statusCode !== 200 || Number(res.headers['content-length']) > MAX_IMAGE_BYTES || (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity')) {
            finish(failure('invalid_card_media')); return
          }
          const chunks = []; let bytes = 0
          res.on('data', chunk => {
            if (settled) return
            bytes += chunk.length
            if (bytes > MAX_IMAGE_BYTES) { finish(failure('invalid_card_media')); return }
            chunks.push(chunk)
          })
          res.once('error', () => finish(failure('invalid_card_media')))
          res.once('aborted', () => finish(failure('invalid_card_media')))
          res.once('close', () => { if (!res.readableEnded) finish(failure('invalid_card_media')) })
          res.once('end', () => {
            if (settled) return
            const buffer = Buffer.concat(chunks)
            try { inspectCardImage(buffer); finish(null, buffer) } catch (error) { finish(error) }
          })
        })
        req.once('error', () => finish(failure('invalid_card_media')))
      } catch { finish(failure('invalid_card_media')) }
    })
  }
  async function optional(source) {
    if (!source || source === 'transparent') return null
    try { return await load(source) } catch { return null }
  }
  return { load, optional }
}

const cardMedia = createCardMediaLoader()
module.exports = { inspectCardImage, createCardMediaLoader, cardMedia, MAX_IMAGE_BYTES, MAX_IMAGE_SIDE, MAX_IMAGE_PIXELS }
