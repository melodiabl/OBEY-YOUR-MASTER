const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')

const service = () => require('../handlers/music/lyrics-pagination')
const json = value => typeof value?.toJSON === 'function' ? value.toJSON() : value
const buttons = payload => (payload.components || []).flatMap(row => json(row).components || []).map(json)
const description = payload => json(payload.embeds?.[0])?.description || payload.content || ''
const flush = async () => { for (let i = 0; i < 6; i++) await new Promise(resolve => setImmediate(resolve)) }

function fixture() {
  let clickSequence = 0
  const collector = new EventEmitter()
  collector.stopped = false
  collector.stop = reason => {
    if (collector.stopped) return
    collector.stopped = true
    collector.emit('end', new Map(), reason)
  }
  const edits = []
  const message = {
    id: 'lyrics-message', guildId: 'guild-one', payload: null,
    async edit(payload) {
      if (message.editHook) await message.editHook(payload)
      message.payload = { ...message.payload, ...payload }
      edits.push(payload)
      return message
    },
    createMessageComponentCollector(options) { collector.options = options; return collector },
  }
  const interaction = {
    user: { id: 'owner' }, guild: { id: 'guild-one' }, guildId: 'guild-one',
    async editReply(payload) { message.payload = payload; return message },
    async reply(payload) { message.payload = payload; return message },
    async fetchReply() { return message },
  }
  function click(action, overrides = {}) {
    const button = buttons(message.payload).find(value => value.custom_id.endsWith(`:${action}`))
    assert.ok(button, `Missing ${action} button`)
    const replies = []
    const event = {
      id: `click-${++clickSequence}`, customId: button.custom_id,
      user: { id: 'owner' }, guild: { id: 'guild-one' }, guildId: 'guild-one',
      message: { id: message.id }, deferred: false, replied: false,
      isButton: () => true,
      async deferUpdate() { event.deferred = true },
      async update(payload) { event.replied = true; return message.edit(payload) },
      async editReply(payload) { return message.edit(payload) },
      async reply(payload) { event.replied = true; replies.push(payload) },
      async followUp(payload) { replies.push(payload) },
      ...overrides,
    }
    if (!collector.stopped && (!collector.options?.filter || collector.options.filter(event))) collector.emit('collect', event)
    return { event, replies }
  }
  return { collector, message, interaction, edits, click }
}

test('pagination preserves every character of lyrics, including blank lines and indentation', () => {
  const text = ('  First verse\n\nSecond verse  \n').repeat(170) + '\n  Ending  '
  const pages = service().paginate(text)
  assert.ok(pages.length > 1)
  assert.equal(pages.join(''), text)
  assert.ok(pages.every(page => page.length > 0 && page.length <= 1800))
})

test('a single long line is split within Discord limits without broken Unicode', () => {
  const text = '🎶'.repeat(2200) + 'Final lyric'
  const pages = service().paginate(text, 1799)
  assert.equal(pages.join(''), text)
  assert.ok(pages.every(page => page.length <= 1799))
  for (const page of pages) {
    assert.doesNotMatch(page, /^[\uDC00-\uDFFF]|[\uD800-\uDBFF]$/)
  }
})

test('all lyric pages are accessible through next and previous buttons', async () => {
  const f = fixture()
  const text = 'a'.repeat(1800) + 'b'.repeat(1800) + 'END'
  await service().showLyrics(f.interaction, { text, title: 'Song', artist: 'Artist' })
  const read = [description(f.message.payload)]
  assert.match(json(f.message.payload.embeds[0]).footer.text, /1\s*\/\s*3/)
  f.click('next'); await flush(); read.push(description(f.message.payload))
  f.click('next'); await flush(); read.push(description(f.message.payload))
  assert.equal(read.join(''), text)
  assert.match(json(f.message.payload.embeds[0]).footer.text, /3\s*\/\s*3/)
  assert.equal(buttons(f.message.payload).find(button => button.custom_id.endsWith(':next')).disabled, true)
  f.click('prev'); await flush()
  assert.equal(description(f.message.payload), read[1])
  assert.equal(f.collector.options.time, 300000)
})

test('button IDs contain opaque session tokens and lyrics cannot enable mentions', async () => {
  const f = fixture()
  await service().showLyrics(f.interaction, { text: '@everyone\n'.repeat(400), title: 'Song', artist: 'Artist' }, 'reply')
  const controls = buttons(f.message.payload)
  assert.equal(controls.length, 3)
  for (const button of controls) assert.match(button.custom_id, /^ly:v1:[0-9a-f-]{36}:(prev|next|close)$/i)
  assert.deepEqual(f.message.payload.allowedMentions, { parse: [] })
  const other = fixture()
  await service().showLyrics(other.interaction, { text: 'b'.repeat(4000), title: 'Other' })
  assert.notEqual(controls[0].custom_id.split(':')[2], buttons(other.message.payload)[0].custom_id.split(':')[2])
})

test('another user cannot turn pages and receives a private refusal', async () => {
  const f = fixture()
  await service().showLyrics(f.interaction, { text: 'a'.repeat(4000), title: 'Song' })
  const before = description(f.message.payload)
  const foreign = f.click('next', { user: { id: 'outsider' } })
  await flush()
  assert.equal(description(f.message.payload), before)
  assert.equal(f.edits.length, 0)
  assert.equal(foreign.replies.length, 1)
  assert.ok(foreign.replies[0].ephemeral || (foreign.replies[0].flags & 64))
})

test('a different guild, message or session cannot operate these controls', async () => {
  const f = fixture()
  await service().showLyrics(f.interaction, { text: 'a'.repeat(4000), title: 'Song' })
  f.click('next', { guildId: 'other-guild', guild: { id: 'other-guild' } })
  f.click('next', { message: { id: 'other-message' } })
  f.click('next', { customId: 'ly:v1:00000000-0000-4000-8000-000000000000:next' })
  await flush()
  assert.equal(f.edits.length, 0)
})

test('timeout and closing remove or disable controls without losing the visible page', async () => {
  for (const reason of ['time', 'close']) {
    const f = fixture()
    await service().showLyrics(f.interaction, { text: 'a'.repeat(4000), title: 'Song' })
    const before = description(f.message.payload)
    if (reason === 'close') f.click('close')
    else f.collector.stop('time')
    await flush()
    assert.equal(f.collector.stopped, true)
    assert.equal(description(f.message.payload), before)
    assert.ok(buttons(f.message.payload).every(button => button.disabled))
    const count = f.edits.length
    if (buttons(f.message.payload).length) f.click('next')
    await flush()
    assert.equal(f.edits.length, count)
  }
})

test('rapid page turns serialize pending message edits and keep the final page current', async () => {
  const f = fixture()
  await service().showLyrics(f.interaction, { text: 'a'.repeat(1800) + 'b'.repeat(1800) + 'LAST', title: 'Song' })
  let release
  f.message.editHook = () => new Promise(resolve => { release = resolve })
  f.click('next'); await flush()
  assert.equal(typeof release, 'function')
  f.click('next'); await flush()
  f.message.editHook = null
  release(); await flush()
  assert.equal(description(f.message.payload), 'LAST')
  assert.equal(f.edits.length, 2)
})

test('expired current-song sessions cannot show lyrics for an earlier track', async () => {
  const f = fixture()
  let current = true
  await service().showLyrics(f.interaction, { text: 'a'.repeat(4000), title: 'Old song', isCurrent: () => current })
  current = false
  const before = description(f.message.payload)
  f.click('next'); await flush()
  assert.equal(f.collector.stopped, true)
  assert.ok(buttons(f.message.payload).every(button => button.disabled))
  assert.equal(description(f.message.payload), before)
})

test('a song that changes during lookup is refused before any old lyrics are published', async () => {
  const f = fixture()
  await service().showLyrics(f.interaction, { text: 'Secret old verse'.repeat(200), title: 'Old song', isCurrent: () => false })
  assert.doesNotMatch(description(f.message.payload), /Secret old verse/)
  assert.ok(description(f.message.payload).length > 0)
  assert.equal(buttons(f.message.payload).length, 0)
  assert.equal(f.collector.options, undefined)
})

test('a repeated Discord interaction ID advances once', async () => {
  const f = fixture()
  await service().showLyrics(f.interaction, { text: 'a'.repeat(1800) + 'b'.repeat(1800) + 'LAST', title: 'Song' })
  f.click('next', { id: 'same-discord-interaction' })
  f.click('next', { id: 'same-discord-interaction' })
  await flush()
  assert.equal(description(f.message.payload), 'b'.repeat(1800))
  assert.equal(f.edits.length, 1)
})

test('missing lyrics produce a useful reply without a pagination collector', async () => {
  for (const text of [null, undefined, '', '   \n  ']) {
    const f = fixture()
    await service().showLyrics(f.interaction, { text, title: 'Song' })
    assert.ok(description(f.message.payload).trim().length > 0)
    assert.equal(buttons(f.message.payload).length, 0)
    assert.equal(f.collector.options, undefined)
  }
})

test('a deleted message during paging or expiry does not cause an unhandled rejection', async () => {
  const f = fixture()
  await service().showLyrics(f.interaction, { text: 'a'.repeat(4000), title: 'Song' })
  f.message.editHook = async () => { throw new Error('Unknown Message') }
  f.click('next'); await flush()
  f.collector.stop('time'); await flush()
  assert.equal(f.edits.length, 0)
})
