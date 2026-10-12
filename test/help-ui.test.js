const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { buildHelpMessage, attachCollector } = require('../handlers/helpui')
const command = (category, index) => ({ id: `prefix:command-${index}`, transport: 'prefix', name: `command-${index}`, invocation: `command-${index}`, category, description: 'Descripción', aliases: [], permissions: [], usage: `command-${index}`, cooldownSeconds: 3 })
function view(categories, commands) { return { prefix: '!', categories, commands, counts: { prefix: commands.length, slash: 0 }, detail: null, query: '' } }

test('help reaches every category beyond the first 25 and bounds page controls', () => {
  const categories = Array.from({ length: 31 }, (_, i) => `Category ${i}`), snapshot = view(categories, categories.map(command))
  const initial = buildHelpMessage(snapshot, { categoryPage: 0 })
  const last = buildHelpMessage(snapshot, { categoryPage: 1 })
  assert.equal(initial.components[0].toJSON().components[0].options.length, 25)
  assert.equal(last.components[0].toJSON().components[0].options.length, 6)
  assert.ok(initial.components.flatMap(row => row.toJSON().components).some(button => button.custom_id === 'hm_categories_next' && !button.disabled))
  const page = buildHelpMessage(view(['Info'], Array.from({ length: 12 }, (_, i) => command('Info', i))), { category: 'Info', page: 99 })
  assert.match(page.embeds[0].toJSON().footer.text, /3\/3/)
})

test('empty help has no invalid select menu and long metadata stays within embed limits', () => {
  const empty = buildHelpMessage(view([], []), {})
  assert.deepEqual(empty.components, [])
  const entry = { ...command('Info', 1), description: '`'.repeat(9000), usage: 'x'.repeat(9000), aliases: Array.from({ length: 100 }, () => 'a'.repeat(100)) }
  const payload = buildHelpMessage(view(['Info'], [entry]), { detailId: entry.id })
  const embed = payload.embeds[0].toJSON()
  assert.ok(embed.description.length <= 4096)
  assert.ok(embed.fields.every(field => field.value.length <= 1024))
  assert.equal(payload.allowedMentions.parse.length, 0)
})

function collectorFixture(reader, initial = {}) {
  const collector = new EventEmitter(), edits = []
  const message = { id: 'message', createMessageComponentCollector: () => collector, edit: async payload => edits.push(payload) }
  collector.stop = () => collector.emit('end')
  attachCollector(reader, message, { guildId: 'g', actorId: 'owner', channelId: 'chat' }, initial)
  return { collector, edits }
}
const settle = () => new Promise(resolve => setImmediate(resolve))
test('collectors reject another owner and clear content when permission refresh fails', async () => {
  let reads = 0
  const f = collectorFixture({ read: async () => { reads++; throw Error('secret provider error') } })
  const responses = []
  const base = { guildId: 'g', message: { id: 'message' }, customId: 'hm_home', isButton: () => true, reply: async value => responses.push(value), deferUpdate: async () => responses.push('deferred'), editReply: async value => responses.push(value) }
  for (const interaction of [{ ...base, user: { id: 'other' } }, { ...base, user: { id: 'owner' }, guildId: 'other' }, { ...base, user: { id: 'owner' }, message: { id: 'other' } }]) f.collector.emit('collect', interaction)
  await settle()
  assert.equal(reads, 0)
  assert.equal(responses[0].ephemeral, true)
  assert.equal(responses.length, 3)
  f.collector.emit('collect', { ...base, user: { id: 'owner' } }); await settle()
  assert.equal(reads, 1)
  assert.deepEqual(responses.at(-1).embeds, [])
  assert.deepEqual(responses.at(-1).components, [])
  assert.ok(!JSON.stringify(responses).includes('secret provider'))
})

test('a response arriving after expiry cannot restore stale controls or contents', async () => {
  let release
  const f = collectorFixture({ read: () => new Promise(resolve => { release = resolve }) }), delivered = []
  f.collector.emit('collect', { user: { id: 'owner' }, guildId: 'g', message: { id: 'message' }, customId: 'hm_home', isButton: () => true,
    deferUpdate: async () => {}, editReply: async value => delivered.push(value) })
  await settle(); f.collector.emit('end')
  release(view(['Info'], [command('Info', 1)])); await settle()
  assert.equal(delivered.length, 0)
  assert.deepEqual(f.edits.at(-1).components, [])
})

test('rapid navigation acknowledges immediately and retains arrival order', async () => {
  const snapshot = view(['Info'], Array.from({ length: 12 }, (_, i) => command('Info', i)))
  const f = collectorFixture({ read: async () => snapshot }, { category: 'Info' }), delivered = []
  let release
  const interaction = (id, deferUpdate) => ({ user: { id: 'owner' }, guildId: 'g', message: { id: 'message' }, customId: id,
    deferUpdate, editReply: async value => delivered.push(value.embeds[0].toJSON().footer.text) })
  f.collector.emit('collect', interaction('hm_next', () => new Promise(resolve => { release = resolve })))
  f.collector.emit('collect', interaction('hm_prev', async () => {}))
  await settle(); assert.equal(delivered.length, 0)
  release(); await settle()
  assert.match(delivered[0], /2\/3/)
  assert.match(delivered[1], /1\/3/)
})

test('the actual slash help defers privately before fetching membership', async () => {
  const { PermissionsBitField } = require('discord.js')
  const guild = { id: 'g' }, collector = new EventEmitter(), calls = []
  const member = { id: 'owner', guild, permissions: new PermissionsBitField(8n), roles: { cache: new Map() }, voice: {} }
  guild.members = { fetch: async () => { calls.push('member'); return member }, fetchMe: async () => member }
  guild.channels = { fetch: async () => ({ id: 'chat', guildId: 'g', permissionsFor: () => new PermissionsBitField(8n) }) }
  const slash = require('../slashCommands/Info/help'), prefix = require('../commands/Info/help')
  const client = { commands: new Map([['help', prefix]]), aliases: new Map(), slashCommands: new Map([['infohelp', slash]]), allCommands: [{ name: 'info', options: [{ type: 1, name: 'help' }] }], settings: { get: () => ({ prefix: '?' }) }, guilds: { cache: new Map([['g', guild]]) } }
  const interaction = { guild, user: { id: 'owner' }, channelId: 'chat', options: { getString: () => '/info help' },
    deferReply: async payload => calls.push(payload), editReply: async payload => calls.push(payload),
    fetchReply: async () => ({ id: 'message', createMessageComponentCollector: () => collector, edit: async () => {} }) }
  await slash.run(client, interaction)
  assert.equal(calls[0].ephemeral, true)
  assert.equal(calls[1], 'member')
  assert.match(calls[2].embeds[0].toJSON().title, /info help/)
})
