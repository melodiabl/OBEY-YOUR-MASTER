const png = require('@napi-rs/canvas').createCanvas(32, 32).toBuffer('image/png')
process.once('message', job => {
  const mode = job.payload.data.username
  if (mode === 'hang') { while (true) {} }
  if (mode === 'crash') return process.exit(23)
  if (mode === 'memory') {
    const pages = []
    while (true) pages.push(Buffer.alloc(16 * 1024 * 1024, 1))
  }
  if (mode === 'invalid') return process.send({ id: job.id, buffer: Buffer.from('not a PNG') }, () => process.exit(0))
  if (mode === 'wrong-id') return process.send({ id: 'wrong-id', buffer: png }, () => process.exit(0))
  if (mode === 'env') {
    const isolated = !process.env.BOT_TOKEN && !process.env.NODE_OPTIONS && !process.env.DATABASE_URL
    return process.send({ id: job.id, buffer: isolated ? png : Buffer.from('inherited secret') }, () => process.exit(0))
  }
  if (mode === 'limits') {
    const limits = require('node:fs').readFileSync('/proc/self/limits', 'utf8')
    const enforced = /Max cpu time\s+2\s+2\s+seconds/.test(limits)
      && /Max data size\s+402653184\s+402653184\s+bytes/.test(limits)
      && /Max core file size\s+0\s+0\s+bytes/.test(limits)
    return process.send({ id: job.id, buffer: enforced ? png : Buffer.from('limits absent') }, () => process.exit(0))
  }
  const delay = mode === 'slow' ? 250 : 0
  setTimeout(() => process.send({ id: job.id, buffer: png }, () => process.exit(0)), delay)
})
process.once('disconnect', () => process.exit(0))
