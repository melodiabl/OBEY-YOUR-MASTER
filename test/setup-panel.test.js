const assert = require('node:assert/strict')
const test = require('node:test')
const { database } = require('../handlers/music/database')
const setup = require('../handlers/music/setup')

test('an existing setup restores its message ID in memory', async () => {
  const original = database.getSetup
  database.getSetup = async () => ({ channelId: 'voice-requests', messageId: 'panel-1' })
  try {
    const result = await setup.create({}, { id: 'setup-existing' })
    assert.equal(result.reason, 'exists')
    assert.equal(setup.getChannelId('setup-existing'), 'voice-requests')
    assert.equal(setup.getMessageId('setup-existing'), 'panel-1')
  } finally {
    database.getSetup = original
  }
})

test('a deleted setup panel is recreated and its new ID is saved', async () => {
  const original = database.createSetup
  const saved = []
  database.createSetup = async (...args) => saved.push(args)
  let pinned = false
  const replacement = { id: 'panel-2', pin: async () => { pinned = true } }
  const channel = {
    messages: { fetch: async () => { throw new Error('deleted') } },
    send: async payload => { assert.deepEqual(payload, { content: 'Reproduciendo' }); return replacement },
  }
  try {
    const result = await setup.updatePanel(
      { channels: { cache: new Map([['voice-requests', channel]]) } },
      'setup-existing',
      { content: 'Reproduciendo' },
    )
    assert.equal(result.id, 'panel-2')
    assert.equal(setup.getMessageId('setup-existing'), 'panel-2')
    assert.equal(pinned, true)
    assert.deepEqual(saved, [['setup-existing', 'voice-requests', 'panel-2']])
  } finally {
    database.createSetup = original
  }
})
