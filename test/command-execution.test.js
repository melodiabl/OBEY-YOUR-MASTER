const assert = require('node:assert/strict')
const test = require('node:test')
const { executeSlashCommand } = require('../handlers/command-execution')

test('a failed deferred slash command receives an error response', async () => {
  const calls = []
  await executeSlashCommand(
    { deferred: true, editReply: async response => calls.push(['edit', response]) },
    async () => { throw new Error('upstream unavailable') },
  )
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], 'edit')
  assert.match(calls[0][1].content, /error/i)
  assert.doesNotMatch(calls[0][1].content, /upstream unavailable/)
})

test('a failed slash command receives an initial private response', async () => {
  const calls = []
  await executeSlashCommand(
    { reply: async response => calls.push(response) },
    async () => { throw new Error('database unavailable') },
  )
  assert.equal(calls.length, 1)
  assert.equal(calls[0].ephemeral, true)
})
