const test = require('node:test'), assert = require('node:assert/strict')
const { measureRequest } = require('../handlers/music/request-timing')
test('normal requests return their result without generating timing logs', async () => {
  const rows = []; let at = 0
  const result = await measureRequest('guild', 'panel_edit', async () => { at = 200; return 'applied' }, { now: () => at, write: row => rows.push(row) })
  assert.equal(result, 'applied'); assert.equal(rows.length, 0)
})
test('slow node and Discord operations record bounded timings without response data or raw IDs', async () => {
  const rows = []; let at = 0
  const options = { now: () => at, write: row => rows.push(row) }
  await measureRequest('private-guild', 'node_update', async () => { at = 1400; return { token: 'secret-response' } }, options)
  const error = Error('secret-provider-error')
  await assert.rejects(measureRequest('private-guild', 'panel_edit', async () => { at += 2000; throw error }, options), error)
  assert.equal(rows[0].durationMs, 1400); assert.equal(rows[0].succeeded, true)
  assert.equal(rows[1].durationMs, 2000); assert.equal(rows[1].succeeded, false)
  assert.equal(rows[0].guild, rows[1].guild); assert.notEqual(rows[0].requestId, rows[1].requestId)
  assert.doesNotMatch(JSON.stringify(rows), /private-guild|secret|token/)
})
