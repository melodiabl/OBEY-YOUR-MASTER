const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createActionQueue } = require('../handlers/music/action-queue')
const { createSessionRepository, snapshot } = require('../handlers/music/sessions')
const { buildAliases } = require('../handlers/command-registry')

test('actions serialize per guild and nested actions do not deadlock', async () => {
  const queue = createActionQueue(), calls = []
  await Promise.all([
    queue.run('one', async () => { calls.push('a'); await queue.run('one', async () => calls.push('nested')) }),
    queue.run('one', async () => calls.push('b')),
  ])
  assert.deepEqual(calls, ['a', 'nested', 'b'])
  await assert.rejects(queue.run('one', async () => { throw new Error('failed') }))
  assert.equal(await queue.run('one', async () => 42), 42)
})

test('session snapshots preserve mute and pause position and cannot mutate after saving', async () => {
  const saved = []
  const repository = createSessionRepository({ findOneAndUpdate: async (_, update) => saved.push(update.$set) })
  const state = { volume: 0, paused: true, lastPosition: 42000, currentTrack: { info: { title: 'A', length: 180000 } }, queue: [], history: [], loop: 'none' }
  const pending = repository.save('one', state)
  state.currentTrack.info.title = 'B'
  await pending
  assert.equal(saved[0].volume, 0)
  assert.equal(saved[0].position, 42000)
  assert.equal(saved[0].currentTrack.info.title, 'A')
  assert.equal(snapshot({ ...state, lastPosition: 999999 }).position, 180000)
})

test('canonical commands are never overridden by aliases', () => {
  const commands = new Map([['play', { name: 'play', aliases: ['p'] }], ['pitch', { name: 'pitch', aliases: ['p', 'play', ''] }]])
  const registry = buildAliases(commands)
  assert.equal(registry.aliases.get('p'), 'play')
  assert.equal(registry.aliases.has('play'), false)
  assert.equal(registry.aliases.has(''), false)
})

test('playlist metadata maps old web entries to the shared Discord format', () => {
  const { canonicalTrack } = require('../handlers/music/playlist-repository')
  const track = canonicalTrack({ url: 'https://example.com/track', info: { title: 'Song', author: 'Artist', length: 42000 } })
  assert.equal(track.uri, track.url)
  assert.equal(track.title, 'Song')
  assert.equal(track.duration, 42000)
  assert.ok(track._id)
})
