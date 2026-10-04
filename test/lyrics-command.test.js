const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const provider = require('../handlers/music/lyrics')
const command = require('../slashCommands/Music/lyrics')
const flush = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)) }
const json = value => value?.toJSON ? value.toJSON() : value
const controls = payload => (payload.components || []).flatMap(row => json(row).components)
const description = payload => json(payload.embeds?.[0])?.description || payload.content || ''

function fixture(query = null, guildId = 'lyrics-command') {
  const collector = new EventEmitter()
  collector.stop = reason => collector.emit('end', new Map(), reason)
  const message = { id: 'lyrics-message', async edit(payload) { message.payload = { ...message.payload, ...payload }; return message },
    createMessageComponentCollector(options) { collector.options = options; return collector } }
  const interaction = { guild: { id: guildId }, guildId, user: { id: 'owner' }, options: { getString: () => query },
    async deferReply() {}, async deferUpdate() {}, isButton: () => true, customId: 'mp_lyrics',
    async editReply(payload) { message.payload = payload; return message },
    async followUp(payload) { message.payload = payload; return message }, async fetchReply() { return message } }
  return { message, collector, interaction }
}

async function withProvider(fetchLyrics, run) {
  const original = provider.fetchLyrics
  provider.fetchLyrics = fetchLyrics
  try { await run() } finally { provider.fetchLyrics = original }
}

test('/lyrics search uses the shared provider and every verse can be reached', async () => {
  const text = 'FIRST'.repeat(360) + 'SECOND'.repeat(300) + 'FINAL'
  const requests = [], f = fixture('Artist - Song')
  await withProvider(async (title, artist) => { requests.push({ title, artist }); return { plain: text, lines: [] } }, async () => {
    await command.run({}, f.interaction)
    assert.deepEqual(requests, [{ title: 'Song', artist: 'Artist' }])
    const read = [description(f.message.payload)]
    for (let page = 1; page < 3; page++) {
      const customId = controls(f.message.payload).find(button => button.custom_id.endsWith(':next')).custom_id
      f.collector.emit('collect', { id: `page-${page}`, customId, user: f.interaction.user, guildId: f.interaction.guildId,
        message: { id: f.message.id }, async deferUpdate() {} })
      await flush()
      read.push(description(f.message.payload))
    }
    assert.equal(read.join(''), text)
  })
})

for (const change of ['another track', 'same track replay', 'new session']) {
  test(`/lyrics refuses a delayed current-track lookup after ${change}`, async () => {
    const f = fixture(), track = { info: { title: 'Song', author: 'Artist' } }
    const state = { currentTrack: track, playbackId: 'play-one', sessionId: 'session-one' }
    let resolve
    await withProvider(() => new Promise(done => { resolve = done }), async () => {
      const pending = command.run({ music: { getState: () => state } }, f.interaction)
      await flush()
      if (change === 'another track') state.currentTrack = { info: { title: 'Next song' } }
      if (change === 'same track replay') state.playbackId = 'play-two'
      if (change === 'new session') state.sessionId = 'session-two'
      resolve({ plain: 'OLD LYRICS'.repeat(400), lines: [] })
      await pending
      assert.doesNotMatch(description(f.message.payload), /OLD LYRICS/)
      assert.match(description(f.message.payload), /canción cambió/i)
      assert.equal(controls(f.message.payload).length, 0)
    })
  })
}

test('the actual music-panel plain-lyrics fallback paginates its full text privately', async () => {
  const f = fixture(null, 'lyrics-panel-fallback'), client = new EventEmitter()
  client.shoukaku = { players: new Map(), nodes: new Map(), options: { nodeResolver: () => null } }
  client.channels = { cache: new Map() }
  require('../handlers/musichandler')(client)
  const state = client.music.getState(f.interaction.guildId)
  state.currentTrack = { info: { title: 'Song', author: 'Artist' } }
  const live = require('../handlers/music/lyricsLive'), original = live.start
  live.start = async () => ({ ok: false, reason: 'no_sync', plain: 'FIRST'.repeat(360) + 'LAST' })
  try {
    const handlers = client.listeners('interactionCreate')
    assert.equal(handlers.length, 1)
    await handlers[0](f.interaction)
    assert.equal(description(f.message.payload), 'FIRST'.repeat(360))
    assert.equal(f.message.payload.ephemeral, true)
    assert.equal(controls(f.message.payload).length, 3)
    const customId = controls(f.message.payload).find(button => button.custom_id.endsWith(':next')).custom_id
    f.collector.emit('collect', { id: 'next', customId, user: f.interaction.user, guildId: f.interaction.guildId,
      message: { id: f.message.id }, async deferUpdate() {} })
    await flush()
    assert.equal(description(f.message.payload), 'LAST')
  } finally { live.start = original }
})
