const test = require('node:test')
const assert = require('node:assert/strict')
const { createDiscordTransport } = require('../handlers/sticky/discord-transport')
function fixture() {
  const state = { deleted: 0, authorId: 'bot', webhookId: null, permissions: true, guildId: 'guild', type: 0, fetchError: null }
  const channel = {
    get guildId() { return state.guildId }, get type() { return state.type },
    permissionsFor: () => ({ has: () => state.permissions }),
    messages: { async fetch() { if (state.fetchError) throw state.fetchError; return { author: { id: state.authorId }, webhookId: state.webhookId, async delete() { state.deleted++ } } } },
  }
  const client = { user: { id: 'bot' }, guilds: { cache: new Map([['guild', { channels: { async fetch() { return channel } }, members: { async fetchMe() { return {} } } }]]) } }
  return { state, transport: createDiscordTransport(client), context: { guildId: 'guild', channelId: 'channel', messageId: 'old' } }
}
test('refuses foreign authors and webhook messages before deletion', async () => {
  const f = fixture(); f.state.authorId = 'member'
  await assert.rejects(f.transport.deleteOwned(f.context), /NOT_OWNED/)
  f.state.authorId = 'bot'; f.state.webhookId = 'webhook'
  await assert.rejects(f.transport.deleteOwned(f.context), /NOT_OWNED/)
  assert.equal(f.state.deleted, 0)
})
test('checks guild ownership, channel type and bot permissions', async () => {
  const f = fixture(); f.state.guildId = 'foreign'
  await assert.rejects(f.transport.assertChannel(f.context), /INVALID_CHANNEL/)
  f.state.guildId = 'guild'; f.state.type = 11
  await assert.rejects(f.transport.assertChannel(f.context), /INVALID_CHANNEL/)
  f.state.type = 0; f.state.permissions = false
  await assert.rejects(f.transport.assertChannel(f.context), /BOT_PERMISSIONS/)
  assert.equal(f.state.deleted, 0)
})
test('already deleted is idempotent but permission errors remain failures', async () => {
  const f = fixture(); f.state.fetchError = { code: 10008 }
  await f.transport.deleteOwned(f.context)
  f.state.fetchError = { code: 50013 }
  await assert.rejects(f.transport.deleteOwned(f.context))
  f.state.fetchError = null; await f.transport.deleteOwned(f.context)
  assert.equal(f.state.deleted, 1)
})
