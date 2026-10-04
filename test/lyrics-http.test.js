const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { requestJson } = require('../handlers/music/lyrics-http')
function fixture(respond) {
  const request = new EventEmitter(), response = new EventEmitter()
  const destroyed = []
  request.destroy = error => { destroyed.push(error); request.emit('error', error) }
  response.statusCode = 200
  const transport = { get: (options, callback) => { setImmediate(() => { callback(response); respond?.(response) }); return request } }
  return { transport, request, response, destroyed }
}
test('lyrics requests accept JSON but reject oversized provider responses', async () => {
  const normal = fixture(res => { res.emit('data', Buffer.from('{"plainLyrics":"Verse"}')); res.emit('end') })
  assert.deepEqual(await requestJson(normal.transport, 'https://example.com'), { plainLyrics: 'Verse' })
  const large = fixture(res => res.emit('data', Buffer.alloc(200)))
  await assert.rejects(requestJson(large.transport, 'https://example.com', { maxBytes: 100 }), /too large/)
  assert.equal(large.destroyed.length, 1)
})
test('stalled lyric providers time out and close the request', async () => {
  const stalled = fixture()
  await assert.rejects(requestJson(stalled.transport, 'https://example.com', { timeoutMs: 10 }), /timeout/)
  assert.equal(stalled.destroyed.length, 1)
})
test('provider errors, malformed JSON and aborted responses terminate cleanly', async () => {
  for (const mode of ['status', 'json', 'aborted']) {
    const f = fixture(res => { if (mode === 'status') res.statusCode = 503; if (mode === 'aborted') res.emit('aborted'); else { res.emit('data', 'invalid'); res.emit('end') } })
    await assert.rejects(requestJson(f.transport, 'https://example.com'))
  }
})
