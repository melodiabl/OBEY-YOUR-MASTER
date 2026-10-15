const test = require('node:test'), assert = require('node:assert/strict')
const express = require('express')
const mount = require('../handlers/music/apiRoutes')
async function fixture(t) {
  const app = express(), calls = [], songs = [{ trackId: 'legacy', uri: 'https://example.test/song', title: 'Song', author: 'Artist' }]
  app.use(express.json()); app.use((req, _, next) => { if (req.get('x-test-user')) req.session = { user: { id: req.get('x-test-user'), username: 'User' } }; next() })
  const client = { guilds: { cache: new Map([['g', { systemChannelId: 'text', channels: { cache: new Map([['voice', { type: 2 }]]) } }]]) },
    music: { getState: () => ({ voiceChannelId: 'voice' }), playCollection: async (...args) => { calls.push(args); return args[3].length } } }
  const repository = { getLikedSongs: async userId => { calls.push({ read: userId }); return songs },
    setLikedSong: async (...args) => { calls.push({ write: args }); return { liked: args[2] ?? true } } }
  mount(app, client, { database: repository, requireAuth: (req, res, next) => req.session?.user ? next() : res.sendStatus(401),
    requireFreshGuildPermissions: (_, __, next) => next(), canManageGuild: user => user.id === 'u' })
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
  t.after(() => new Promise(resolve => server.close(resolve)))
  async function request(path, body, user = 'u') {
    const r = await fetch('http://127.0.0.1:' + server.address().port + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(user ? { 'x-test-user': user } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
    return { status: r.status, headers: r.headers, body: await r.json().catch(() => null) }
  }
  return { calls, songs, request }
}
test('liked collection reads only the signed-in user and is never cacheable', async t => {
  const f = await fixture(t)
  assert.equal((await f.request('/api/music/liked', null, '')).status, 401)
  const r = await f.request('/api/music/liked?userId=other')
  assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(f.calls, [{ read: 'u' }])
})
test('liking validates input, ignores a supplied owner and supports explicit save/remove', async t => {
  const f = await fixture(t)
  assert.equal((await f.request('/api/music/like', { trackId: { $ne: '' } })).status, 400)
  const r = await f.request('/api/music/like', { userId: 'other', trackId: 'id', uri: 'https://example.test/song', title: 'Song', liked: true })
  assert.equal(r.body.data.liked, true); assert.equal(f.calls.at(-1).write[0], 'u'); assert.equal(f.calls.at(-1).write[2], true)
})
test('playing the collection validates access before loading private tracks', async t => {
  const f = await fixture(t), path = '/api/music/liked/play/g'
  assert.equal((await f.request(path, {}, '')).status, 401)
  assert.equal((await f.request(path, {}, 'other')).status, 403)
  assert.deepEqual(f.calls, [])
  const r = await f.request(path, { userId: 'other' })
  assert.equal(r.body.data.added, 1); assert.equal(f.calls[0].read, 'u')
  const args = f.calls[1]; assert.equal(args[0], 'g'); assert.equal(args[1], 'voice'); assert.equal(args[3][0].info.uri, f.songs[0].uri)
})
test('empty or invalid voice choices do not enqueue songs', async t => {
  const f = await fixture(t)
  assert.equal((await f.request('/api/music/liked/play/g', { voiceChannelId: 'not-a-channel' })).status, 400)
  f.songs.length = 0
  assert.equal((await f.request('/api/music/liked/play/g', {})).body.error, 'empty_collection')
  f.songs.push({ uri: 'file:///etc/passwd' })
  assert.equal((await f.request('/api/music/liked/play/g', {})).body.error, 'empty_collection')
  assert.ok(!f.calls.some(Array.isArray))
})
