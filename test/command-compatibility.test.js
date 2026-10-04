const { test } = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { Client, PermissionFlagsBits } = require('discord.js')
const { FastType } = require('../handlers/games')
const { commandDenial } = require('../handlers/music/permissions')
const SyncMap = require('../handlers/sync-map')

test('legacy FastType completes through the installed game library', async () => {
  const client = new Client({ intents: [] })
  const collector = new EventEmitter(), buttons = new EventEmitter()
  collector.stop = () => {}
  const edits = [], replies = []
  const sent = { edit: async value => edits.push(value), createMessageComponentCollector: () => buttons }
  const message = {
    client, author: { id: 'game-fixture', username: 'Fixture' }, guild: { id: 'guild' },
    reply: async value => { replies.push(value); return sent },
    channel: { isSendable: () => true, isDMBased: () => false, createMessageCollector: () => collector, send: async value => replies.push(value) },
  }
  await FastType({ interaction: message, embeds: [{ title: 'Fast type', color: 0x5865f2, footer: { text: 'OBEY' }, timestamp: new Date() }], sentence: 'hola mundo' })
  collector.emit('collect', { author: message.author, content: 'hola mundo' })
  await new Promise(resolve => setTimeout(resolve, 15))
  assert.equal(replies.length, 2)
  assert.equal(edits[0].components[0].components[0].data.disabled, true)
  client.destroy()
})

test('music permissions distinguish DJ, requester and administrator', () => {
  const client = { settings: { get: () => ({ djroles: ['dj'], djonlycmds: ['volume'], requestonlycmds: ['skip'] }) } }
  const member = { id: 'requester', guild: { id: 'guild' }, roles: { cache: new Map() }, permissions: { has: () => false } }
  const track = { info: { requesterId: 'requester' } }
  assert.equal(commandDenial(client, member, 'skip', track), null)
  assert.match(commandDenial(client, member, 'volume', track), /DJ/)
  member.roles.cache.set('dj', true)
  assert.equal(commandDenial(client, member, 'volume', track), null)
  member.id = 'other'
  assert.match(commandDenial(client, member, 'skip', track), /solicitante/)
  member.permissions.has = flag => flag === PermissionFlagsBits.Administrator
  assert.equal(commandDenial(client, member, 'skip', track), null)
})

test('invalid currency cannot poison balances or create a database write', async () => {
  const writes = []
  const store = new SyncMap({ findOneAndUpdate: async (_, update) => writes.push(update) })
  store.set('user', 25, 'balance')
  await store.flush()
  const before = writes.length
  assert.throws(() => store.math('user', '+', NaN, 'balance'), /número/)
  assert.equal(store.get('user', 'balance'), 25)
  await store.flush()
  assert.equal(writes.length, before)
})
