// Isolated browser/API fixtures; never sends Discord messages or plays live audio.
const { chromium } = require(process.argv[2] || 'playwright')
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path')
const root = path.resolve(__dirname, '..'), ejs = require('ejs')
async function main() {
  const browser = await chromium.launch({ headless: true }), errors = [], played = []
  const songs = [
    { trackId: 'legacy-encoding', uri: 'https://example.test/one', title: 'Primera canción', author: 'Un artista', length: 180000 },
    { trackId: 'second', uri: 'https://example.test/two', title: '<texto literal>', author: 'Otro artista', length: 210000 },
  ]
  const current = { title: songs[0].title, author: songs[0].author, uri: songs[0].uri, identifier: 'different-node-id', length: 180000 }
  const state = { guildId: 'g', active: true, current, sessionId: 's', playbackId: 'p', revision: 1, paused: true, clockRunning: false, queue: [current], volume: 50 }
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
    page.on('pageerror', e => errors.push(e.message))
    const html = await ejs.renderFile(root + '/dashboard/views/pages/music.ejs', { guild: { id: 'g', name: 'Comunidad Aurora' }, muser: { username: 'María' }, prefix: '!', csrfToken: 'fixture' })
    await page.route('**/*', async route => {
      const req = route.request(), url = new URL(req.url()), p = url.pathname
      if (url.hostname !== 'liked-fixture.local') return route.fulfill({ body: '', contentType: 'text/plain' })
      if (p === '/music') return route.fulfill({ body: html, contentType: 'text/html' })
      if (p === '/socket.io/socket.io.js') return route.fulfill({ body: 'window.io=()=>({on(){return this},emit(){}})', contentType: 'application/javascript' })
      const file = path.join(root, 'dashboard/public', p)
      if (fs.existsSync(file) && fs.statSync(file).isFile()) return route.fulfill({ path: file })
      let body = { success: true, data: [] }
      if (p === '/api/music/liked') body.data = songs
      if (p === '/api/player/g') body = state
      if (p === '/api/playlist/list') body.data = [{ _id: 'ordinary', name: 'Mi playlist', tracks: [] }]
      if (p === '/api/playlist/view/ordinary') body.data = { tracks: [] }
      if (p === '/api/music/like') {
        const input = req.postDataJSON(), index = songs.findIndex(t => t.uri === input.uri || t.trackId === input.trackId)
        if (input.liked === false && index >= 0) songs.splice(index, 1)
        else if (input.liked === true && index < 0) songs.push({ ...input, artworkUrl: input.artwork })
        body.data = { liked: input.liked }
      }
      if (p === '/api/music/liked/play/g') { played.push(req.postDataJSON()); body.data = { added: songs.length } }
      return route.fulfill({ body: JSON.stringify(body), contentType: 'application/json' })
    })
    await page.goto('http://liked-fixture.local/music')
    await page.locator('#side-liked').waitFor({ timeout: 3000 })
    await page.waitForFunction(() => document.querySelector('#side-liked-count').textContent.includes('2'))
    await page.locator('[data-view="library"]').first().click()
    await page.locator('#liked-library').waitFor()
    assert.ok(await page.locator('#liked-library').isVisible())
    await page.screenshot({ path: root + '/docs/platform/evidence/liked-library-1280.png' })
    await page.locator('#liked-library').click()
    await page.waitForFunction(() => document.querySelectorAll('.liked-track').length === 2)
    assert.equal(await page.locator('.liked-track literal').count(), 0)
    await page.locator('#pl-play').click(); await page.waitForTimeout(100)
    assert.equal(played.length, 1)
    await page.locator('#bar-like').click()
    await page.waitForFunction(() => document.querySelectorAll('.liked-track').length === 1)
    assert.ok((await page.locator('#side-liked-count').textContent()).includes('1'))
    assert.equal(await page.locator('#bar-like').getAttribute('aria-pressed'), 'false')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.locator('.liked-track-remove').click()
    await page.waitForFunction(() => document.querySelector('#pl-play').disabled)
    assert.ok((await page.locator('#g-pldetail').textContent()).includes('corazón'))
    await page.screenshot({ path: root + '/docs/platform/evidence/liked-empty-390.png' })
    await page.locator('#bar-like').click()
    await page.waitForFunction(() => document.querySelectorAll('.liked-track').length === 1)
    await page.reload()
    await page.locator('#menu').click(); await page.locator('#side-liked').click()
    await page.waitForFunction(() => document.querySelector('#sidebar').getBoundingClientRect().right <= 0)
    await page.waitForFunction(() => document.querySelectorAll('.liked-track').length === 1)
    songs.push({ trackId: 'from-discord', uri: 'https://example.test/discord', title: 'Guardada desde Discord', author: 'Otro artista', length: 220000 })
    await page.waitForFunction(() => document.querySelectorAll('.liked-track').length === 2, null, { timeout: 18000 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: root + '/docs/platform/evidence/liked-playlist-390.png' })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.screenshot({ path: root + '/docs/platform/evidence/liked-playlist-1280.png' })
    await page.locator('#pl-back').click()
    await page.locator('#g-pl .card').filter({ hasText: 'Mi playlist' }).click()
    assert.ok((await page.locator('#pl-title').textContent()).includes('Mi playlist'))
    assert.deepEqual(errors, [])
    const report = { scope: 'Real EJS and browser scripts, stateful isolated API fixtures; no live voice', states: ['pinned personal collection', 'library playlist', 'play all', 'legacy key unlike', 'empty state', 'heart state', 'save again', 'reload', 'refresh from independent backend update', 'ordinary playlists preserved', 'desktop and mobile', 'safe provider text'], errors }
    fs.writeFileSync(root + '/docs/platform/evidence/liked-browser.json', JSON.stringify(report, null, 2) + '\n')
    console.log(JSON.stringify(report))
  } finally { await browser.close() }
}
main().catch(e => { console.error(e.message); process.exitCode = 1 })
