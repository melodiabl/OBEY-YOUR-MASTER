const assert = require('node:assert/strict'), fs = require('node:fs/promises'), path = require('node:path')
const { chromium } = require(process.argv[3] || 'playwright')
const origin = process.argv[2]
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin || '')) throw Error('Use the isolated loopback help fixture')
;(async () => {
  assert.equal((await fetch(origin + '/fixture-info').then(response => response.json())).fixture, true)
  const directory = path.resolve(__dirname, '../docs/platform/evidence/help'); await fs.mkdir(directory, { recursive: true })
  const browser = await chromium.launch({ headless: true }), errors = []
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.fulfill({ body: '', contentType: 'text/css' }))
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message))
    await page.goto(origin + '/fixture-login')
    await page.waitForFunction(() => !document.getElementById('help-fields').disabled)
    assert.equal(await page.locator('.help-command').count(), 25)
    assert.equal(await page.locator('#help-list img').count(), 0)
    await page.locator('#help-next').click(); await page.waitForFunction(() => document.getElementById('help-page').textContent.includes('2 de'))
    await page.locator('#help-prev').click(); await page.waitForFunction(() => document.getElementById('help-page').textContent.includes('1 de'))
    await page.locator('#help-search').fill('first'); await page.locator('#help-filters button[type=submit]').click()
    await page.waitForFunction(() => document.querySelectorAll('.help-command').length === 1)
    await page.locator('.help-command button').click(); await page.locator('#help-detail').waitFor({ state: 'visible' })
    assert.match(await page.locator('#help-detail-fields').textContent(), /first/)
    await page.locator('#help-close').click()
    assert.equal(await page.locator('#help-search').evaluate(element => element === document.activeElement), true)
    await page.locator('#help-search').fill('missing command'); await page.locator('#help-filters button[type=submit]').click()
    await page.waitForFunction(() => document.getElementById('help-status').textContent.startsWith('No hay'))
    assert.equal(await page.locator('.help-command').count(), 0)
    await page.locator('#help-search').fill('ban'); await page.locator('#help-category').selectOption('Moderation'); await page.locator('#help-filters button[type=submit]').click()
    await page.waitForFunction(() => document.querySelectorAll('.help-command').length === 1)
    await fetch(origin + '/fixture-mode/limited'); await page.locator('#help-refresh').click()
    await page.waitForFunction(() => document.getElementById('help-status').textContent.startsWith('No hay'))
    assert.equal(await page.locator('#help-category').inputValue(), 'Moderation')
    await page.locator('#help-search').fill(''); await page.locator('#help-category').selectOption(''); await page.locator('#help-filters button[type=submit]').click()
    await page.waitForFunction(() => document.querySelectorAll('.help-command').length === 25)
    await page.screenshot({ path: path.join(directory, 'desktop.png'), fullPage: true })
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      const fits = await page.evaluate(() => [...document.querySelectorAll('#help-app .card, #help-fields, #help-search')].every(element => element.getBoundingClientRect().right <= innerWidth + 1))
      assert.equal(fits, true, 'overflow at ' + width)
    }
    await page.setViewportSize({ width: 320, height: 1000 })
    await page.waitForFunction(() => document.getElementById('sidebar').getBoundingClientRect().right <= 1)
    await page.screenshot({ path: path.join(directory, 'mobile.png'), fullPage: true })
    await fetch(origin + '/fixture-mode/denied'); await page.locator('#help-refresh').click()
    await page.waitForFunction(() => document.getElementById('help-status').textContent.includes('acceso'))
    assert.equal(await page.locator('.help-command').count(), 0)
    assert.equal(await page.locator('#help-search').isDisabled(), true)
    assert.deepEqual(errors, [])
    const result = { fixture: true, server: 'real Express/EJS and shared help service; fixture handlers and Discord permissions', searchAndAliases: true,
      pagination: true, detail: true, emptyState: true, escapedContent: true, freshRoleFiltering: true, revocationClearsResults: true,
      keyboardFocus: true, breakpoints: [320, 768, 1024, 1440], pageErrors: errors }
    await fs.writeFile(path.join(directory, 'browser.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result))
  } finally { await browser.close() }
})().catch(error => { console.error(error); process.exitCode = 1 })
