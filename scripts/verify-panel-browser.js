const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const { chromium } = require(process.argv[3] || 'playwright')
const origin = process.argv[2]
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin || '')) throw Error('Use the isolated loopback panel fixture')
async function main() {
  const info = await fetch(origin + '/fixture-info').then(response => response.json())
  assert.equal(info.fixture, true); assert.equal(info.production, false)
  const directory = path.resolve(__dirname, '../docs/platform/evidence/panel')
  await fs.mkdir(directory, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const errors = [], failedAssets = [], pages = []
  async function capture(page, filename) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    // Capture the visible horizontal viewport; off-canvas drawers are not page content.
    await page.screenshot({ path: path.join(directory, filename), clip: { x: 0, y: 0, width: page.viewportSize().width,
      height: await page.evaluate(() => document.documentElement.scrollHeight) } })
  }
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    page.on('response', response => { if (/\/(css|fonts|js|vendor)\//.test(response.url()) && response.status() >= 400) failedAssets.push({ url: response.url(), status: response.status() }) })
    for (const [name, route] of [
      ['home', '/panel'], ['servers', '/dashboard'], ['settings', '/dashboard/panel-fixture'],
      ['library', '/library/panel-fixture'], ['stats', '/stats/panel-fixture'], ['music', '/music/panel-fixture'],
    ]) {
      await page.setViewportSize({ width: 1440, height: 1000 })
      const response = await page.goto(origin + route)
      assert.equal(response.status(), 200, route)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(200)
      const type = await page.evaluate(() => ({
        body: getComputedStyle(document.body).fontFamily,
        heading: getComputedStyle(document.querySelector('h1,h2')).fontFamily,
        loaded: [...document.fonts].filter(font => font.status === 'loaded').map(font => ({ family: font.family, weight: font.weight })),
      }))
      assert.match(type.body, /DM Sans/); assert.match(type.heading, /DM Sans/)
      assert.ok(type.loaded.some(font => font.family === 'DM Sans' && font.weight === '400'))
      assert.ok(type.loaded.some(font => font.family === 'DM Sans' && font.weight === '700'))
      assert.ok(type.loaded.some(font => font.family === 'Font Awesome 6 Free'))
      if (name !== 'music') assert.equal(await page.locator('.sidebar [aria-current=page]').count(), 1, 'active section ' + name)
      if (name === 'stats') assert.equal(await page.locator('.chart-body').evaluateAll(elements => elements.every(element => element.getBoundingClientRect().height === 320)), true)
      if (name === 'music') {
        assert.equal(await page.locator('#queuep').isVisible(), false)
        await page.locator('#q-toggle').click(); assert.equal(await page.locator('#queuep').isVisible(), true)
        await page.locator('#q-close').click(); assert.equal(await page.locator('#queuep').isVisible(), false)
      }
      await capture(page, name + '-desktop.png')
      for (const width of [320, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.waitForFunction(expected => innerWidth === expected && matchMedia('(max-width:980px)').matches === (expected <= 980), width)
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
        const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 1,
          viewport: innerWidth, cssMobile: matchMedia('(max-width:980px)').matches, mainMargin: getComputedStyle(document.querySelector('main,.main')).marginLeft,
          offenders: [...document.querySelectorAll('body *')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).map(element => ({ tag: element.tagName, id: element.id, className: element.className, right: element.getBoundingClientRect().right })).slice(0,12) }))
        assert.equal(layout.overflow, false, name + ' overflow at ' + width + ': ' + JSON.stringify(layout))
        const contentFits = await page.evaluate(() => [...document.querySelectorAll('.page,.card,.form-input,.form-select,#settings-nav,.hero,.player')]
          .filter(element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden')
          .every(element => element.getBoundingClientRect().right <= innerWidth + 1))
        assert.equal(contentFits, true, name + ' visible content exceeds viewport at ' + width)
      }
      await page.setViewportSize({ width: 320, height: 1000 })
      await capture(page, name + '-mobile.png')
      pages.push({ name, route, typography: type, breakpoints: [320, 768, 1024, 1440] })
    }
    await page.goto(origin + '/dashboard')
    await page.locator('#servers-search').fill('musica')
    assert.equal(await page.locator('.guild-card:visible').count(), 1)
    await page.locator('#servers-search').fill('')
    await page.locator('#servers-filter').selectOption('invite')
    assert.equal(await page.locator('.guild-card:visible').count(), 1)
    await page.locator('#servers-search').fill('no existe')
    assert.equal(await page.locator('#servers-no-results').isVisible(), true)
    await page.goto(origin + '/dashboard?empty=1')
    assert.equal(await page.locator('.empty').isVisible(), true)
    await page.goto(origin + '/dashboard/panel-fixture?long=1')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
    assert.equal(await page.locator('.sidebar [aria-current=page]').textContent(), 'Configuración')
    const links = await page.locator('.sidebar a').evaluateAll(elements => elements.map(element => element.getAttribute('href')))
    for (const route of ['/configuration/panel-fixture/welcome', '/cards/panel-fixture', '/music/panel-fixture', '/help/panel-fixture']) assert.ok(links.includes(route))
    assert.equal(await page.locator('#save-bar').isVisible(), false)
    await page.locator('input[name=prefix]').fill('?')
    assert.equal(await page.locator('#save-bar').isVisible(), true)
    await page.locator('#save-discard').click()
    assert.equal(await page.locator('#save-bar').isVisible(), false)
    assert.equal(await page.locator('input[name=prefix]').inputValue(), '!')
    assert.equal(await page.locator('#sidebar').evaluate(element => element.inert), true)
    await page.locator('#menuBtn').click()
    assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'), 'true')
    assert.equal(await page.locator('#main-content').evaluate(element => element.inert), true)
    await page.locator('.su-logout').focus(); await page.keyboard.press('Tab')
    assert.equal(await page.locator('#menuBtn').evaluate(element => element === document.activeElement), true)
    await page.keyboard.press('Shift+Tab')
    assert.equal(await page.locator('.su-logout').evaluate(element => element === document.activeElement), true)
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('#sidebar').evaluate(element => element.inert), true)
    assert.equal(await page.locator('#main-content').evaluate(element => element.inert), false)
    assert.equal(await page.locator('#menuBtn').evaluate(element => element === document.activeElement), true)
    await page.locator('#menuBtn').click(); await page.locator('#overlay').click({ position: { x: 310, y: 500 } })
    assert.equal(await page.locator('#menuBtn').getAttribute('aria-expanded'), 'false')
    await page.setViewportSize({ width: 1440, height: 1000 })
    assert.equal(await page.locator('#sidebar').evaluate(element => element.inert), false)
    await page.goto(origin + '/dashboard')
    await page.keyboard.press('Tab'); await page.keyboard.press('Enter')
    assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content')
    assert.deepEqual(errors, []); assert.deepEqual(failedAssets, [])
    const report = { fixture: true, production: false, externalRequestsBlocked: true, localTypographyAndIcons: true,
      serverSearchAndFilter: true, emptyAndLongNames: true, contextualNavigation: true,
      mobileMenuInertAndFocusTrap: true, escapeAndBackdropRestoreFocus: true, skipLink: true,
      pages, pageErrors: errors, failedAssets }
    await fs.writeFile(path.join(directory, 'browser.json'), JSON.stringify(report, null, 2) + '\n')
    console.log(JSON.stringify({ ...report, pages: pages.map(page => page.name) }))
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
