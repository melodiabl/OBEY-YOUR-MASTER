// Local visual verification: real panel EJS and CSS; no Discord, DB or provider calls.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const express = require('express')
const { chromium } = require(process.argv[2] || 'playwright')
const root = path.resolve(__dirname, '..')
const brands = require('../assets/obey/platforms/sources.json').brands
const classes = require('../assets/obey/web-icon-map.json').classes

async function main() {
  const app = express(), errors = []
  app.set('views', path.join(root, 'dashboard/views')); app.set('view engine', 'ejs')
  app.use(express.static(path.join(root, 'dashboard/public')))
  app.get('/panel', (_, res) => res.render('pages/home', { user: { id: 'fixture', username: 'Fixture', avatar: null }, bot: { guilds: 1, commands: 19 }, csrfToken: 'fixture' }))
  app.get('/api/stats', (_, res) => res.json({ guilds: 1, users: 1, activePlayers: 0 }))
  app.get('/api/nowplaying', (_, res) => res.json({ tracks: [] }))
  app.get('/api/sse', (_, res) => { res.type('text/event-stream').end('data: {"guilds":1}\n\n') })
  app.get('/platform-fixture', (_, res) => res.send(`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Identidad de plataformas · OBEY</title><link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/css/obey-icons.css"><style>body{margin:0;background:#101722;color:#f3f3f5;font-family:var(--font-ui);padding:24px;box-sizing:border-box}*{box-sizing:border-box}h1{font-size:24px}p{color:#b6c0d2}.brands{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}.brand{padding:20px 12px;background:#192336;border:1px solid #334158;border-radius:12px;text-align:center}.brand img{width:64px;height:64px;display:block;margin:0 auto 12px}.mapping{display:flex;gap:18px;flex-wrap:wrap;padding:20px 0}.mapping i{font-size:24px}</style><h1>Plataformas</h1><p>Logos de servicios y controles propios de OBEY.</p><div class="brands">${brands.map(b => `<div class="brand"><img alt="" src="/obey-icons/${b.key.replace('.', '_')}.svg"><span>${b.title}</span></div>`).join('')}</div><div class="mapping">${Object.entries(classes).filter(([cls, key]) => key.startsWith('brand.') || ['fa-music', 'fa-headphones'].includes(cls)).map(([cls]) => `<i class="${cls}" aria-hidden="true"></i>`).join('')}</div></html>`))
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)) })
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage(), base = `http://127.0.0.1:${server.address().port}`
    page.on('pageerror', e => errors.push(e.message))
    const observations = []
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(base + '/platform-fixture')
      const data = await page.evaluate(() => ({ images: [...document.images].map(i => ({ path: new URL(i.src).pathname, loaded: i.complete && i.naturalWidth > 0 })), mappings: [...document.querySelectorAll('.mapping i')].map(i => ({ cls: i.className, background: getComputedStyle(i).backgroundImage })), overflow: document.documentElement.scrollWidth > innerWidth, font: getComputedStyle(document.body).fontFamily }))
      assert.equal(data.images.length, 15); assert.ok(data.images.every(i => i.loaded)); assert.equal(data.overflow, false)
      for (const i of data.mappings) {
        const localPath = i.background.match(/\/obey-icons\/[^"')]+/)?.[0]
        assert.ok(localPath?.startsWith('/obey-icons/' + classes[i.cls].replace('.', '_') + '.'), i.cls)
        assert.ok(fs.existsSync(path.join(root, 'dashboard/public', localPath)), i.cls)
      }
      await page.screenshot({ path: root + `/docs/platform/evidence/platforms-${width}.png`, fullPage: true })
      observations.push({ width, ...data })
    }
    await page.goto(base + '/panel')
    assert.ok(await page.locator('link[href="/css/obey-icons.css"]').count())
    const discord = page.locator('i.fa-discord').first()
    if (await discord.count()) assert.ok((await discord.evaluate(i => getComputedStyle(i).backgroundImage)).includes('brand_discord.svg'))
    assert.deepEqual(errors, [])
    const report = { scope: 'Real panel EJS, local CSS/SVG and platform gallery in Chromium; no external services', observations, errors }
    fs.writeFileSync(root + '/docs/platform/evidence/platforms-browser.json', JSON.stringify(report, null, 2) + '\n')
    console.log(JSON.stringify({ brands: brands.length, viewports: observations.map(o => o.width), panel: true, errors }))
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)) }
}
main().catch(e => { console.error(e.message); process.exitCode = 1 })
