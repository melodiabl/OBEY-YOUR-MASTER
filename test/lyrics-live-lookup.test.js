const { test } = require('node:test')
const assert = require('node:assert/strict')
const provider = require('../handlers/music/lyrics')
const flush = async () => { for (let i = 0; i < 3; i++) await new Promise(resolve => setImmediate(resolve)) }

async function withLive(fetchLyrics, run) {
  const path = require.resolve('../handlers/music/lyricsLive'), originalCache = require.cache[path], originalFetch = provider.fetchLyrics
  delete require.cache[path]
  provider.fetchLyrics = fetchLyrics
  const live = require(path)
  try { await run(live) } finally {
    for (const id of ['live-replay-lookup', 'live-change-send']) live.stop(id)
    provider.fetchLyrics = originalFetch
    delete require.cache[path]
    if (originalCache) require.cache[path] = originalCache
  }
}

function fixture(guildId) {
  const state = { currentTrack: { info: { identifier: 'same-song', title: 'Song', author: 'Artist' } },
    playbackId: 'play-one', sessionId: 'session-one', textChannelId: 'text' }
  const sent = []
  const channel = { id: 'text', async send(payload) { sent.push(payload); return { id: 'live-message', async edit() {}, async delete() {} } } }
  const client = { music: { getState: () => state }, channels: { cache: new Map([['text', channel]]) } }
  return { client, state, channel, sent, guildId }
}

for (const change of ['replay', 'replacement with the same identifier', 'session restart']) {
  test(`live lyrics lookup cannot activate after ${change}`, async () => {
    const f = fixture('live-replay-lookup')
    let resolve
    await withLive(() => new Promise(done => { resolve = done }), async live => {
      const pending = live.start(f.client, f.guildId)
      await flush()
      if (change === 'replay') f.state.playbackId = 'play-two'
      if (change === 'replacement with the same identifier') f.state.currentTrack = { info: { ...f.state.currentTrack.info } }
      if (change === 'session restart') f.state.sessionId = 'session-two'
      resolve({ lines: [{ ms: 0, text: 'OLD PLAYBACK' }] })
      const result = await pending
      assert.equal(result.ok, false)
      assert.equal(result.reason, 'track_changed')
      assert.equal(f.sent.length, 0)
      assert.equal(live.isActive(f.guildId), false)
    })
  })
}

test('a delayed live-message send cannot install a stale session after the song changes', async () => {
  const f = fixture('live-change-send')
  let finishSend, deleted = false
  f.channel.send = () => new Promise(resolve => { finishSend = resolve })
  await withLive(async () => ({ lines: [{ ms: 0, text: 'OLD SONG' }] }), async live => {
    const pending = live.start(f.client, f.guildId)
    await flush()
    assert.equal(typeof finishSend, 'function')
    f.state.currentTrack = { info: { identifier: 'different-song', title: 'Next' } }
    f.state.playbackId = 'play-two'
    finishSend({ id: 'late-message', async edit() {}, async delete() { deleted = true } })
    const result = await pending
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'track_changed')
    assert.equal(live.isActive(f.guildId), false)
    assert.equal(deleted, true)
  })
})

test('turning lyrics off while a lookup is pending prevents a late activation', async () => {
  const f = fixture('live-replay-lookup')
  let resolve
  await withLive(() => new Promise(done => { resolve = done }), async live => {
    const pending = live.start(f.client, f.guildId)
    await flush()
    assert.equal(live.isActive(f.guildId), true)
    live.stop(f.guildId)
    assert.equal(live.isActive(f.guildId), false)
    resolve({ lines: [{ ms: 0, text: 'CANCELLED' }] })
    const result = await pending
    assert.equal(result.ok, false)
    assert.equal(live.isActive(f.guildId), false)
    assert.equal(f.sent.length, 0)
  })
})

test('only the latest simultaneous lookup can create a live session', async () => {
  const f = fixture('live-replay-lookup')
  const resolve = []
  await withLive(() => new Promise(done => resolve.push(done)), async live => {
    const first = live.start(f.client, f.guildId)
    const second = live.start(f.client, f.guildId)
    await flush()
    resolve[1]({ lines: [{ ms: 0, text: 'NEWEST' }] })
    assert.equal((await second).ok, true)
    resolve[0]({ lines: [{ ms: 0, text: 'OLDER' }] })
    assert.equal((await first).ok, false)
    assert.equal(f.sent.length, 1)
    assert.equal(live.isActive(f.guildId), true)
  })
})
