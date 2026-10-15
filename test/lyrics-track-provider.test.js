const test = require('node:test'), assert = require('node:assert/strict')
async function fixture(request, run) {
  const transport = require('../handlers/music/lyrics-http'), original = transport.requestJson
  const path = require.resolve('../handlers/music/lyrics'), cache = require.cache[path]
  transport.requestJson = request; delete require.cache[path]
  try { await run(require(path)) }
  finally { transport.requestJson = original; delete require.cache[path]; if (cache) require.cache[path] = cache }
}
test('lyrics use the active node and the exact encoded recording without querying the private host', async () => {
  let endpoint
  await fixture(async () => { throw Error('Unexpected HTTP fallback') }, async provider => {
    const node = { name: 'public', rest: { async fetch(request) {
      endpoint = request.endpoint
      return { lines: [{ timestamp: 1500, line: 'Verse' }, { timestamp: 3000, line: '' }] }
    } } }
    const result = await provider.fetchLyrics('Title', 'Artist', { node, encoded: 'recording+/=', lyricsPlugin: true })
    assert.equal(endpoint, '/lyrics?track=recording%2B%2F%3D')
    assert.deepEqual(result.lines, [{ ms: 1500, text: 'Verse' }, { ms: 3000, text: '' }])
  })
})
test('LRCLIB receives recording duration and cache separates studio and live versions', async () => {
  const urls = []
  await fixture(async (_, options) => {
    const url = new URL(options.href); urls.push(url)
    return { duration: Number(url.searchParams.get('duration')), syncedLyrics: '[00:01.00]Verse', plainLyrics: 'Verse' }
  }, async provider => {
    await provider.fetchLyrics('Title (Official Audio)', 'Artist - Topic', { durationMs: 180000 })
    await provider.fetchLyrics('Title (Official Audio)', 'Artist - Topic', { durationMs: 210000 })
    assert.equal(urls.length, 2)
    assert.deepEqual(urls.map(url => url.searchParams.get('duration')), ['180', '210'])
    assert.equal(urls[0].searchParams.get('track_name'), 'Title')
    assert.equal(urls[0].searchParams.get('artist_name'), 'Artist')
    await provider.fetchLyrics('Title (Live)', 'Artist', { durationMs: 220000 })
    assert.equal(urls[2].searchParams.get('track_name'), 'Title (Live)')
  })
})
test('a different recording duration never supplies falsely synchronized lyrics', async () => {
  await fixture(async () => ({ duration: 180, syncedLyrics: '[00:01.00]Wrong recording', plainLyrics: 'Wrong recording' }), async provider => {
    assert.equal(await provider.fetchLyrics('Title', 'Artist', { durationMs: 240000 }), null)
  })
})
