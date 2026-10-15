const test = require('node:test'), assert = require('node:assert/strict')
const { trackKey, createLikedSongsService } = require('../handlers/music/likes')
const song = (encoded = 'node-a') => ({ encoded, info: { identifier: 'song', uri: 'https://example.test/song', title: 'Song', author: 'Artist', length: 10000 } })
function fixture(initial = []) {
  const rows = structuredClone(initial)
  const matches = (row, q) => Object.entries(q).every(([k, v]) => k === '$or' ? v.some(part => matches(row, part)) : row[k] === v)
  const store = {
    async findOne(q) { return rows.find(r => matches(r, q)) || null },
    async updateOne(q, update) { if (!rows.some(r => matches(r, q))) rows.push({ ...q, ...update.$setOnInsert, likedAt: new Date() }) },
    async deleteMany(q) { for (let i = rows.length - 1; i >= 0; i--) if (matches(rows[i], q)) rows.splice(i, 1) },
    find(q) { return { sort() { return this }, async lean() { return rows.filter(r => matches(r, q)).sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt)) } } },
  }
  return { rows, store, service: createLikedSongsService(store) }
}
test('a favorite keeps its identity across nodes and web metadata', () => {
  assert.equal(trackKey(song()), trackKey(song('node-b')))
  assert.equal(trackKey(song()), trackKey({ info: song().info }))
})
test('unliking a legacy encoding removes its duplicates for this user only', async () => {
  const f = fixture([{ userId: 'u', trackId: 'old-a', uri: song().info.uri }, { userId: 'u', trackId: 'old-b', uri: song().info.uri }, { userId: 'other', trackId: 'old-a', uri: song().info.uri }])
  const result = await f.service.toggleLike('u', song('new-encoding'))
  assert.equal(result.liked, false)
  assert.deepEqual(f.rows.map(r => r.userId), ['other'])
})
test('repeated save requests create one favorite and repeated removal stays removed', async () => {
  const f = fixture()
  await Promise.all([f.service.setLiked('u', song(), true), f.service.setLiked('u', song('node-b'), true)])
  assert.equal(f.rows.length, 1)
  await f.service.setLiked('u', song(), false); await f.service.setLiked('u', song(), false)
  assert.equal(f.rows.length, 0)
})
test('the collection shows the latest copy of a recording and preserves legacy rows', async () => {
  const f = fixture([{ userId: 'u', trackId: 'a', uri: song().info.uri, title: 'Older', likedAt: '2025-01-01' }, { userId: 'u', trackId: 'b', uri: song().info.uri, title: 'Newest', likedAt: '2026-01-01' }, { userId: 'other', trackId: 'c' }])
  assert.deepEqual((await f.service.getLikedSongs('u')).map(r => r.title), ['Newest'])
  assert.equal(await f.service.getLikedSongsCount('u'), 1)
  assert.equal(f.rows.length, 3)
})
test('storage errors never report a successful favorite', async () => {
  const f = fixture(); f.store.updateOne = async () => { throw new Error('offline') }
  await assert.rejects(f.service.setLiked('u', song(), true), /offline/)
})
