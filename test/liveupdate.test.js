const test = require('node:test')
const assert = require('node:assert/strict')
const { getState, liveMessages } = require('../handlers/music/state')
const { scheduleNpUpdate, stopLiveUpdate } = require('../handlers/music/liveupdate')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

test('a pending panel fetch cannot render an old track after playback ends', async () => {
  const id = 'panel-finished'
  let release
  const edits = []
  const client = { channels: { cache: new Map([['text', { messages: { fetch: () => new Promise(resolve => { release = () => resolve({ edit: async payload => edits.push(payload) }) }) } }]]) } }
  getState(id).currentTrack = { info: { title: 'Finished', length: 10000 } }
  liveMessages.set(id, { channelId: 'text', messageId: 'pinned' })
  scheduleNpUpdate(client, id)
  await wait(230)
  getState(id).currentTrack = null
  const stopped = stopLiveUpdate(id)
  release()
  await stopped
  await wait(10)
  assert.equal(edits.length, 0)
  liveMessages.delete(id)
})

test('panel edits are serialized and use the current track after awaiting Discord', async () => {
  const id = 'panel-switch'
  const edits = []
  let active = 0, maximum = 0
  const client = { channels: { cache: new Map([['text', { messages: { fetch: async () => ({ edit: async payload => {
    active++; maximum = Math.max(maximum, active)
    edits.push(payload.embeds[0].toJSON().description)
    await wait(280)
    active--
  } }) } }]]) } }
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
