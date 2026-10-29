// Native codecs run outside the bot process; input is bounded and never written to disk.
const { loadImage } = require('@napi-rs/canvas')
const { inspectAvatarImage } = require('./avatar-media')
const { MAX_IMAGE_BYTES } = require('./card-media')
const chunks = []
let bytes = 0
process.stdin.on('data', chunk => {
  bytes += chunk.length
  if (bytes > MAX_IMAGE_BYTES) process.exit(1)
  chunks.push(chunk)
})
process.stdin.on('error', () => process.exit(1))
process.stdin.on('end', async () => {
  try {
    const buffer = Buffer.concat(chunks), metadata = inspectAvatarImage(buffer), image = await loadImage(buffer)
    if (image.width !== metadata.width || image.height !== metadata.height) process.exit(1)
    process.stdout.write('ok')
  } catch { process.exitCode = 1 }
})
