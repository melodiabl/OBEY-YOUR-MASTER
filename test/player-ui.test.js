const { test } = require('node:test')
const assert = require('node:assert/strict')
const createVolumeControl = require('../dashboard/public/js/player-volume')
const createReceiver = require('../dashboard/public/js/player-state')

test('slider stays at the latest input while stale states and acknowledgements arrive', async () => {
  const display = [], calls = [], releases = []
  const control = createVolumeControl({ display: value => display.push(value), send: value => { calls.push(value); return new Promise(resolve => releases.push(resolve)) }, onError: assert.fail })
  control.receive(100)
  control.input(40, true)
  control.receive(100)
  control.input(0, true)
  releases.shift()(40)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(display.at(-1), 0)
  assert.deepEqual(calls, [40, 0])
  releases.shift()(0)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(display.at(-1), 0)
})

test('failed volume requests restore the confirmed value and show an error', async () => {
  let shown, error
  const control = createVolumeControl({ display: value => { shown = value }, send: async () => { throw new Error('offline') }, onError: value => { error = value } })
  control.receive(25)
  control.input(90, true)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(shown, 25)
  assert.equal(error.message, 'offline')
})

test('older player revisions and pre-reconnect snapshots cannot replace the new song', () => {
  const rendered = [], receive = createReceiver(state => rendered.push(state))
  receive({ active: true, sessionId: 'one', revision: 2, updatedAt: 200 })
  assert.equal(receive({ active: true, sessionId: 'one', revision: 1, updatedAt: 201 }), false)
  receive({ active: false, sessionId: 'two', revision: 0, updatedAt: 300 })
  assert.equal(receive({ active: true, sessionId: 'one', revision: 3, updatedAt: 210 }), false)
  assert.equal(rendered.length, 2)
})
