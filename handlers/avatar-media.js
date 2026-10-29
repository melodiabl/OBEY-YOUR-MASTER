const { inspectCardImage, createCardMediaLoader, MAX_IMAGE_BYTES, MAX_IMAGE_SIDE, MAX_IMAGE_PIXELS } = require('./card-media')
const invalid = () => { throw Object.assign(new Error('profile_avatar'), { code: 'profile_avatar' }) }
const { spawn } = require('node:child_process')
const { readFile } = require('node:fs/promises')
const path = require('node:path')
function inspectGifPixels(data, minimum, expected, colors) {
  const clear = 1 << minimum, end = clear + 1, lengths = new Uint32Array(4096)
  for (let i = 0; i < clear; i++) lengths[i] = 1
  let bits = 0, size = minimum + 1, next = end + 1, previous = -1, pixels = 0, cleared = false
  while (bits + size <= data.length * 8) {
    let code = 0
    for (let i = 0; i < size; i++, bits++) code |= ((data[bits >> 3] >> (bits & 7)) & 1) << i
    if (code === clear) { size = minimum + 1; next = end + 1; previous = -1; cleared = true; continue }
    if (!cleared) invalid()
    if (code === end) { if (pixels !== expected) invalid(); return }
    if (code < clear && code >= colors) invalid()
    const length = code < next ? lengths[code] : code === next && previous >= 0 ? lengths[previous] + 1 : 0
    if (!length || pixels + length > expected) invalid()
    pixels += length
    if (previous >= 0 && next < 4096) { lengths[next++] = lengths[previous] + 1; if (next === 1 << size && size < 12) size++ }
    previous = code
  }
  invalid()
}
function inspectAvatarImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 13 || buffer.length > MAX_IMAGE_BYTES) invalid()
  if (!['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))) {
    let image
    try { image = inspectCardImage(buffer) } catch { invalid() }
    if (!['image/png', 'image/jpeg'].includes(image.type)) invalid()
    return image
  }
  const width = buffer.readUInt16LE(6), height = buffer.readUInt16LE(8)
  if (!width || !height || width > MAX_IMAGE_SIDE || height > MAX_IMAGE_SIDE || width * height > MAX_IMAGE_PIXELS) invalid()
  const globalColors = buffer[10] & 0x80 ? 2 ** ((buffer[10] & 7) + 1) : 0
  let offset = 13 + 3 * globalColors, frames = 0
  function blocks(collect = false) {
    const chunks = []
    while (offset < buffer.length) {
      const length = buffer[offset++]
      if (!length) return collect ? Buffer.concat(chunks) : null
      if (offset + length > buffer.length) invalid()
      if (collect) chunks.push(buffer.subarray(offset, offset + length))
      offset += length
    }
    invalid()
  }
  while (offset < buffer.length) {
    const tag = buffer[offset++]
    if (tag === 0x3b) {
      if (offset !== buffer.length || !frames) invalid()
      return { type: 'image/gif', width, height }
    }
    if (tag === 0x21) { if (offset >= buffer.length) invalid(); offset++; blocks(); continue }
    if (tag !== 0x2c || offset + 9 > buffer.length) invalid()
    const left = buffer.readUInt16LE(offset), top = buffer.readUInt16LE(offset + 2), w = buffer.readUInt16LE(offset + 4), h = buffer.readUInt16LE(offset + 6), packed = buffer[offset + 8]
    if (!w || !h || left + w > width || top + h > height) invalid()
    const localColors = packed & 0x80 ? 2 ** ((packed & 7) + 1) : 0, colors = localColors || globalColors
    if (!colors) invalid()
    offset += 9 + 3 * localColors
    if (offset >= buffer.length || buffer[offset] < 2 || buffer[offset] > 8) invalid()
    const minimum = buffer[offset++]
    inspectGifPixels(blocks(true), minimum, w * h, colors)
    frames++
    if (frames > 1000 || width * height * frames > 32 * 1024 * 1024) invalid()
  }
  invalid()
}
const avatarMedia = createCardMediaLoader({ inspect: inspectAvatarImage })
async function validateAvatarImage(buffer) {
  const metadata = inspectAvatarImage(buffer)
  await new Promise((resolve, reject) => {
    const nodeArgs = ['--max-old-space-size=96', path.join(__dirname, 'avatar-image-worker.js')]
    const options = { stdio: ['pipe', 'pipe', 'ignore'], env: { PATH: '/usr/bin:/bin', LANG: 'C.UTF-8', TZ: 'UTC' } }
    const child = process.platform === 'linux' ? spawn('/usr/bin/prlimit', ['--core=0', '--', process.execPath, ...nodeArgs], options)
      : spawn(process.execPath, nodeArgs, options)
    let output = '', failed = false
    let reading = false
    const monitor = process.platform === 'linux' ? setInterval(async () => {
      if (reading || !child.pid) return
      reading = true
      try {
        const status = await readFile(`/proc/${child.pid}/status`, 'utf8'), rss = Number(status.match(/^VmRSS:\s+(\d+)\s+kB/m)?.[1]) * 1024
        if (rss > 256 * 1024 * 1024) { failed = true; child.kill('SIGKILL') }
      } catch { /* The child may have already exited. */ }
      finally { reading = false }
    }, 50) : undefined
    const timer = setTimeout(() => { failed = true; child.kill('SIGKILL') }, 5000)
    child.stdout.on('data', chunk => { output += chunk; if (output.length > 16) { failed = true; child.kill('SIGKILL') } })
    child.stdin.on('error', () => { failed = true })
    child.once('error', () => { failed = true })
    child.once('close', code => {
      clearTimeout(timer); clearInterval(monitor)
      if (failed || code !== 0 || output !== 'ok') reject(Object.assign(new Error('profile_avatar'), { code: 'profile_avatar' }))
      else resolve()
    })
    child.stdin.end(buffer)
  })
  return metadata
}
module.exports = { inspectAvatarImage, validateAvatarImage, avatarMedia }
