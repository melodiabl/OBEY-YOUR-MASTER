const assert = require('node:assert/strict'), fs = require('node:fs/promises'), path = require('node:path')
const express = require('express'), session = require('express-session')
const { chromium } = require(process.argv[2] || 'playwright')
const { canManageGuild } = require('../handlers/permissions')
async function main() {
  const app = express(), server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const origin = 'http://127.0.0.1:' + server.address().port, directory = path.resolve(__dirname, '../docs/platform/evidence/music-nodes')
  await fs.mkdir(directory, { recursive: true })
  let preference = 'auto', allowed = true, failWrite = false
  const view = () => ({ preferenceId: preference, currentId: preference, nodes: [
    { id: 'public-one', label: 'TriniumHost V4', status: 'online' }, { id: 'public-two', label: 'Nazha V4', status: 'offline' },
  ] })
  app.use(express.json()); app.use(session({ secret: 'isolated-node-browser-fixture', resave: false, saveUninitialized: false }))
  app.use(require('../dashboard/security').csrfProtection(origin))
  app.set('views', path.resolve(__dirname, '../dashboard/views')); app.set('view engine', 'ejs')
  app.use(express.static(path.resolve(__dirname, '../dashboard/public')))
  app.get('/fixture-login', (req, res) => { req.session.user = { id: 'admin', username: 'Admin', guilds: [{ id: 'g', permissions: '32' }] }; res.redirect('/nodes/g') })
  app.get('/fixture-mode/:mode', (req, res) => { allowed = req.params.mode !== 'denied'; failWrite = req.params.mode === 'failed'; res.json({ fixture: true }) })
  app.get('/api/stats', (req, res) => res.json({ guilds: 1 }))
  require('../dashboard/nodes-routes')(app, { guilds: { cache: new Map([['g', { id: 'g', name: 'Comunidad de música' }]]) }, music: {
    getNodes: view, setNodePreference: async (guildId, nodeId) => { if (failWrite) throw Error('node_change_failed'); preference = nodeId; return view() },
  } }, { canManageGuild, requireAuth: (req, res, next) => req.session.user ? next() : res.status(401).json({ error: 'login' }),
    requireFreshGuildPermissions: (req, res, next) => { req.session.user.guilds = allowed ? [{ id: 'g', permissions: '32' }] : []; next() } })
  const browser = await chromium.launch({ headless: true }), errors = []
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.fulfill({ body: '' }))
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message))
    await page.goto(origin + '/fixture-login'); await page.waitForFunction(() => !document.getElementById('nodes-fields').disabled)
    assert.equal(await page.locator('#nodes-choice option[value="public-two"]').isDisabled(), true)
    await page.locator('#nodes-choice').selectOption('public-one'); await page.locator('#nodes-form button').click()
    await page.waitForFunction(() => document.getElementById('nodes-status').textContent === 'Preferencia guardada.')
    await page.reload(); await page.waitForFunction(() => document.getElementById('nodes-choice').value === 'public-one')
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'overflow at ' + width)
    }
    await page.screenshot({ path: path.join(directory, 'desktop.png'), fullPage: true })
    await page.setViewportSize({ width: 320, height: 1000 }); await page.screenshot({ path: path.join(directory, 'mobile.png'), fullPage: true })
    await page.locator('#nodes-choice').focus(); await page.keyboard.press('Tab'); assert.equal(await page.locator('#nodes-form button').evaluate(button => button === document.activeElement), true)
    const csrf = await page.locator('meta[name="csrf-token"]').getAttribute('content')
    const protectedStatus = await context.request.post(origin + '/api/player/g/nodes', { data: { nodeId: 'auto' } }); assert.equal(protectedStatus.status(), 403)
    await page.goto(origin + '/fixture-mode/failed'); await page.goto(origin + '/nodes/g'); await page.waitForFunction(() => !document.getElementById('nodes-fields').disabled)
    await page.locator('#nodes-choice').selectOption('auto'); await page.locator('#nodes-form button').click()
    await page.waitForFunction(() => document.getElementById('nodes-status').textContent.includes('recuperará'))
    assert.equal(preference, 'public-one')
    await page.goto(origin + '/fixture-mode/denied')
    const denied = await context.request.post(origin + '/api/player/g/nodes', { headers: { 'x-csrf-token': csrf }, data: { nodeId: 'auto' } }); assert.equal(denied.status(), 403)
    assert.deepEqual(errors, [])
    const evidence = { fixture: true, production: false, widths: [320, 768, 1024, 1440], overflow: false, preferencePersists: true, offlineDisabled: true, csrf: true, revokedAccess: true, failedWritePreservesPreference: true, keyboard: true, pageErrors: errors }
    await fs.writeFile(path.join(directory, 'browser.json'), JSON.stringify(evidence, null, 2) + '\n'); console.log(JSON.stringify(evidence))
  } finally { await browser.close(); await new Promise(resolve => { server.close(resolve); server.closeAllConnections() }) }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
