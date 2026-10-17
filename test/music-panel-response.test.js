const test = require('node:test'), assert = require('node:assert/strict'), { EventEmitter } = require('node:events')
const { getState, playerStates, liveMessages } = require('../handlers/music/state')
const live = require('../handlers/music/liveupdate')
const settle = () => new Promise(resolve => setImmediate(resolve))
function fixture(id, channel) {
  const client = new EventEmitter()
  client.channels = { cache: new Map([['text', channel]]) }
  client.shoukaku = { players: new Map(), nodes: new Map(), options: { nodeResolver: () => null } }
  require('../handlers/music/index')(client)
  const state = getState(id)
  Object.assign(state, { textChannelId: 'text', currentTrack: { encoded: 'old', info: { title: 'Old', length: 180000 } }, status: 'playing' })
  return { client, state, cleanup: async () => { client._shuttingDown = true; await live.stopLiveUpdate(id); liveMessages.delete(id); playerStates.delete(id) } }
}
test('a known panel is edited by ID without fetching it first', async () => {
  const id = 'direct-panel-edit'; let reads = 0, edits = 0
  const f = fixture(id, { messages: { fetch: async () => { reads++; return { edit: async () => { edits++ } } }, edit: async messageId => { assert.equal(messageId, 'panel'); edits++ } } })
  liveMessages.set(id, { channelId: 'text', messageId: 'panel' })
  await live.updatePanel(f.client, id); await f.cleanup()
  assert.equal(reads, 0); assert.equal(edits, 1)
})
test('track changes reuse the existing panel rather than deleting and sending messages', async () => {
  const id = 'reuse-track-panel'; let sends = 0, edits = 0, deletes = 0
  const message = { id: 'panel', edit: async () => { edits++; return message }, delete: async () => { deletes++ } }
  const f = fixture(id, { id: 'text', messages: { fetch: async () => message, edit: async () => { edits++; return message } }, send: async () => { sends++; return message } })
  liveMessages.set(id, { channelId: 'text', messageId: 'panel' })
  await f.client.music.sendNowPlaying(id, f.state.currentTrack); await f.cleanup()
  assert.equal(sends, 0); assert.equal(deletes, 0); assert.equal(edits, 1)
})
test('publication bursts during a slow first send keep one panel and refresh the latest track', async () => {
  const id = 'coalesced-publication'; let sends = 0, release, began
  const edits = [], started = new Promise(resolve => { began = resolve })
  const message = { id: 'panel', edit: async payload => { edits.push(payload.embeds[0].toJSON().description); return message }, delete: async () => {} }
  const f = fixture(id, { id: 'text', messages: { fetch: async () => message, edit: async (messageId, payload) => message.edit(payload) }, send: async () => {
    sends++; if (sends === 1) { began(); await new Promise(resolve => { release = resolve }) }; return message
  } })
  const first = f.client.music.sendNowPlaying(id, f.state.currentTrack); await started
  f.state.currentTrack = { encoded: 'latest', info: { title: 'Latest', length: 180000 } }
  const burst = Array.from({ length: 20 }, () => f.client.music.sendNowPlaying(id, f.state.currentTrack))
  release(); await Promise.all([first, ...burst]); await f.cleanup()
  assert.equal(sends, 1); assert.equal(edits.length, 1); assert.match(edits[0], /Latest/)
})
test('confirmed button refreshes start immediately instead of waiting for the debounce timer', async () => {
  const id = 'immediate-control-panel'; let edits = 0
  const message = { edit: async () => { edits++ } }
  const f = fixture(id, { messages: { fetch: async () => message, edit: async () => { edits++ } } })
  liveMessages.set(id, { channelId: 'text', messageId: 'panel' })
  live.scheduleNpUpdate(f.client, id)
  live.scheduleNpUpdate(f.client, id, { immediate: true })
  await settle(); const beforeTimer = edits; await f.cleanup()
  assert.equal(beforeTimer, 1)
})
test('a deleted setup panel is replaced after Discord confirms that its message is missing', async () => {
  const id = 'deleted-direct-panel', setup = require('../handlers/music/setup'), original = setup.updatePanel
  let replacements = 0
  const f = fixture(id, { messages: { edit: async () => { throw Object.assign(Error('missing'), { code: 10008 }) } } })
  const reference = { channelId: 'text', messageId: 'missing', isSetup: true }; liveMessages.set(id, reference)
  setup.updatePanel = async () => { replacements++; return { id: 'replacement' } }
  try {
    await live.updatePanel(f.client, id)
    assert.equal(replacements, 1); assert.equal(reference.messageId, 'replacement')
  } finally { setup.updatePanel = original; await f.cleanup() }
})
test('a transient Discord edit failure does not create a duplicate setup panel', async () => {
  const id = 'transient-direct-panel', setup = require('../handlers/music/setup'), original = setup.updatePanel
  let replacements = 0
  const f = fixture(id, { messages: { edit: async () => { throw Object.assign(Error('temporary'), { code: 50013 }) } } })
  const reference = { channelId: 'text', messageId: 'panel', isSetup: true }; liveMessages.set(id, reference)
  setup.updatePanel = async () => { replacements++; return { id: 'unexpected' } }
  try {
    await live.updatePanel(f.client, id)
    assert.equal(replacements, 0); assert.equal(reference.messageId, 'panel')
  } finally { setup.updatePanel = original; await f.cleanup() }
})
test('periodic progress ticks do not keep scheduling work behind a slow edit', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] })
  const id = 'periodic-panel-pressure'; let edits = 0, release, began
  const started = new Promise(resolve => { began = resolve })
  const f = fixture(id, { messages: { edit: async () => { edits++; if (edits === 1) { began(); await new Promise(resolve => { release = resolve }) } } } })
  liveMessages.set(id, { channelId: 'text', messageId: 'panel' })
  live.startLiveUpdate(f.client, id); t.mock.timers.tick(5000); await started
  t.mock.timers.tick(15000); release(); await settle()
  const writes = edits; await f.cleanup(); assert.equal(writes, 1)
})
test('Discord rate-limit backoff pauses background ticks while confirmed changes still render', async t => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'], now: 100000 })
  const id = 'panel-rate-backoff'; let edits = 0
  const f = fixture(id, { messages: { edit: async () => { edits++ } } })
  liveMessages.set(id, { channelId: 'text', messageId: 'panel' }); live.startLiveUpdate(f.client, id)
  live.deferProgress('text', 1000); t.mock.timers.tick(5000); await settle()
  assert.equal(edits, 0)
  await live.scheduleNpUpdate(f.client, id, { immediate: true }); assert.equal(edits, 1)
  t.mock.timers.tick(5000); await settle(); assert.equal(edits, 2)
  await f.cleanup()
})
