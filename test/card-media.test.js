const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { PassThrough } = require('node:stream')
const { createCanvas } = require('@napi-rs/canvas')
const { inspectCardImage, createCardMediaLoader, MAX_IMAGE_BYTES } = require('../handlers/card-media')
const url = 'https://cdn.discordapp.com/attachments/123/456/background.png?ex=fixture'
const png = () => createCanvas(32, 32).toBuffer('image/png')

test('only bounded raster images with valid dimensions reach the decoder', () => {
  assert.deepEqual(inspectCardImage(png()), { type: 'image/png', width: 32, height: 32 })
  const enormous = png(); enormous.writeUInt32BE(100000, 16)
  for (const value of [enormous, Buffer.from('<svg/>'), Buffer.from('bad'), Buffer.alloc(MAX_IMAGE_BYTES + 1), url]) {
    assert.throws(() => inspectCardImage(value), error => error.code === 'invalid_card_image')
  }
})

function fixture({ status = 200, body = png(), headers = { 'content-type': 'image/png' }, stall = false, timeoutMs = 500, truncated = false } = {}) {
  const calls = [], requests = []
  const loader = createCardMediaLoader({ timeoutMs, request: (target, options, callback) => {
    calls.push({ target: String(target), options })
    const req = new EventEmitter(); req.destroy = () => { req.destroyed = true }
    requests.push(req)
    if (!stall) setImmediate(() => {
      const response = new PassThrough(); response.statusCode = status; response.headers = headers
      callback(response)
      if (truncated) response.destroy()
      else if (!response.destroyed) response.end(body)
    })
    return req
  } })
  return { loader, calls, requests }
}

test('untrusted schemes, local paths and hosts are rejected before any request', async () => {
  const { loader, calls } = fixture()
  for (const source of ['file:///etc/passwd', '/etc/passwd', 'http://cdn.discordapp.com/a.png', 'https://127.0.0.1/a.png', 'https://cdn.discordapp.com.evil.test/a.png', 'https://evil.test/a.png', 'https://user:pass@cdn.discordapp.com/a.png', 'https://cdn.discordapp.com:444/a.png']) {
    await assert.rejects(loader.load(source), error => error.code === 'invalid_card_media')
  }
  assert.equal(calls.length, 0)
})

test('HTTPS download validates bytes rather than trusting an image extension', async () => {
  const { loader, calls } = fixture()
  assert.ok((await loader.load(url)).equals(png()))
  assert.equal(calls.length, 1)
  assert.equal(calls[0].options.headers.Authorization, undefined)
  assert.equal((await fixture({ body: Buffer.from('<svg/>') }).loader.optional(url)), null)
})

test('redirects, oversized bodies, truncated streams and deadline failures are bounded', async () => {
  assert.equal(await fixture({ status: 302, headers: { location: 'http://127.0.0.1/' } }).loader.optional(url), null)
  assert.equal(await fixture({ body: Buffer.alloc(MAX_IMAGE_BYTES + 1) }).loader.optional(url), null)
  assert.equal(await fixture({ headers: { 'content-length': String(MAX_IMAGE_BYTES + 1) } }).loader.optional(url), null)
  assert.equal(await fixture({ truncated: true }).loader.optional(url), null)
  const stalled = fixture({ stall: true, timeoutMs: 20 })
  assert.equal(await stalled.loader.optional(url), null)
  assert.equal(stalled.requests[0].destroyed, true)
})

test('buffers are validated and absent media does not initiate a download', async () => {
  const { loader, calls } = fixture()
  assert.ok((await loader.load(png())).equals(png()))
  for (const value of [null, undefined, '', 'transparent', Buffer.from('invalid')]) assert.equal(await loader.optional(value), null)
  assert.equal(calls.length, 0)
})

test('JPEG and static WebP output from the native encoder have bounded dimensions', () => {
  const canvas = createCanvas(48, 24)
  for (const type of ['image/jpeg', 'image/webp']) assert.deepEqual(inspectCardImage(canvas.toBuffer(type)), { type, width: 48, height: 24 })
  const truncated = png().subarray(0, 40)
  assert.throws(() => inspectCardImage(truncated), error => error.code === 'invalid_card_image')
})
