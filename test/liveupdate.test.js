const test = require('node:test')
const assert = require('node:assert/strict')
const { getState, liveMessages } = require('../handlers/music/state')
const { scheduleNpUpdate, stopLiveUpdate } = require('../handlers/music/liveupdate')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

test('a queued panel refresh cannot render an old track after playback ends', async () => {
  const id = 'panel-finished'
  const edits = []
  const client = { channels: { cache: new Map([['text', { messages: { edit: async (messageId, payload) => edits.push(payload) } }]]) } }
  getState(id).currentTrack = { info: { title: 'Finished', length: 10000 } }
  liveMessages.set(id, { channelId: 'text', messageId: 'pinned' })
  const refresh = require('../handlers/music/liveupdate').updatePanel(client, id)
  getState(id).currentTrack = null
  const stopped = stopLiveUpdate(id)
  await Promise.all([refresh, stopped])
  assert.equal(edits.length, 0)
  liveMessages.delete(id)
})

test('panel edits are serialized and use the current track after awaiting Discord', async () => {
  const id = 'panel-switch'
  const edits = []
  let active = 0, maximum = 0
  const client = { channels: { cache: new Map([['text', { messages: { edit: async (messageId, payload) => {
    active++; maximum = Math.max(maximum, active)
    edits.push(payload.embeds[0].toJSON().description)
    await wait(280)
    active--
  } } }]]) } }
  getState(id).currentTrack = { info: { title: 'First', length: 10000 } }
  liveMessages.set(id, { channelId: 'text', messageId: 'pinned' })
  scheduleNpUpdate(client, id)
  await wait(230)
  getState(id).currentTrack = { info: { title: 'Second', length: 10000 } }
  scheduleNpUpdate(client, id)
  await wait(600)
  await stopLiveUpdate(id)
  assert.equal(maximum, 1)
  assert.match(edits.at(-1), /Second/)
  liveMessages.delete(id)
})

test('bursts during a slow Discord edit render the latest state without accumulating writes', async () => {
  const { updatePanel } = require('../handlers/music/liveupdate')
  const id = 'panel-burst', edits = []
  let release, began
  const started = new Promise(resolve => { began = resolve })
  const client = { channels: { cache: new Map([['text', { messages: { edit: async (messageId, payload) => {
    edits.push(payload.embeds[0].toJSON().description)
    if (edits.length === 1) { began(); await new Promise(resolve => { release = resolve }) }
  } } }]]) } }
  getState(id).currentTrack = { info: { title: 'Initial', length: 10000 } }
  liveMessages.set(id, { channelId: 'text', messageId: 'pinned' })
  const first = updatePanel(client, id)
  await started
  const burst = Array.from({ length: 100 }, () => updatePanel(client, id))
  getState(id).currentTrack = { info: { title: 'Latest', length: 10000 } }
  release()
  await Promise.all([first, ...burst])
  await stopLiveUpdate(id); liveMessages.delete(id)
  assert.equal(edits.length, 2, 'one in-flight edit plus one refresh for all 100 newer requests')
  assert.match(edits.at(-1), /Latest/)
})

test('stopping cancels a coalesced refresh while restarting can render the new generation', async () => {
  const { updatePanel } = require('../handlers/music/liveupdate')
  const id = 'panel-generations', edits = []; let release, began
  const started = new Promise(resolve => { began = resolve })
  const client = { channels: { cache: new Map([['text', { messages: { edit: async (messageId, payload) => {
    edits.push(payload.embeds[0].toJSON().description)
    if (edits.length === 1) { began(); await new Promise(resolve => { release = resolve }) }
  } } }]]) } }
  getState(id).currentTrack = { info: { title: 'Old', length: 10000 } }
  liveMessages.set(id, { channelId: 'text', messageId: 'pinned' })
  const first = updatePanel(client, id); await started
  updatePanel(client, id); stopLiveUpdate(id)
  getState(id).currentTrack = { info: { title: 'New generation', length: 10000 } }
  const latest = updatePanel(client, id); release()
  await Promise.all([first, latest]); await stopLiveUpdate(id); liveMessages.delete(id)
  assert.equal(edits.length, 2); assert.match(edits[0], /Old/); assert.match(edits[1], /New generation/)
})
