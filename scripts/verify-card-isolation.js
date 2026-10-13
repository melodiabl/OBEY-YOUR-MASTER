// Offline resource/response evidence. Fixture workers never contact Discord.
const fs = require('node:fs/promises')
const path = require('node:path')
const { fork } = require('node:child_process')
const assert = require('node:assert/strict')
const { performance } = require('node:perf_hooks')
const { createCardPool } = require('../handlers/card-pool')
const { deliverCardPayload } = require('../handlers/card-delivery')
const { inspectCardImage } = require('../handlers/card-media')
const fixturePath = path.join(__dirname, '../test/helpers/card-worker-fixture.js')
const output = path.join(__dirname, '../docs/platform/evidence/cards/isolation.json')
const payload = name => ({ data: { username: name, guildName: 'Fixture', discriminator: '0', memberCount: 10 } })

async function main() {
  const children = [], timings = {}, pools = []
  const make = options => {
    const pool = createCardPool({ forkProcess: (...args) => { const child = fork(...args); children.push(child); return child }, ...options })
    pools.push(pool); return pool
  }
  let ticks = 0
  const timer = setInterval(() => ticks++, 10)
  try {
    const native = make(), start = performance.now()
    const buffer = await native.render('welcome', { ...payload('Obey'), showAvatar: false, frameColor: '#3A98F0' })
    timings.nativeMs = Math.round(performance.now() - start)
    assert.equal(inspectCardImage(buffer).width, 1772)
    const fixture = make({ workerPath: fixturePath, timeoutMs: 600, rssLimitBytes: 112 * 1024 * 1024, pollMs: 10 })
    const before = ticks, hangStart = performance.now()
    await assert.rejects(fixture.render('welcome', payload('hang')), error => error.code === 'card_worker_timeout')
    timings.timeoutMs = Math.round(performance.now() - hangStart)
    const responsiveTicks = ticks - before
    assert.ok(responsiveTicks > 3)
    await assert.rejects(fixture.render('leave', payload('crash')), error => error.code === 'card_worker_failed')
    await assert.rejects(fixture.render('leave', payload('memory')), error => error.code === 'card_worker_memory')
    assert.ok(Buffer.isBuffer(await fixture.render('welcome', payload('env'))))
    const sent = []
    const delivery = await deliverCardPayload({ filename: 'welcome-image.png', payload: { embeds: [{ description: 'Mensaje de prueba' }] },
      render: () => fixture.render('welcome', payload('hang')), capabilities: async () => ({ send: true, embed: true, attach: true }),
      send: async message => { sent.push(message); return { id: 'fixture-message' } },
    })
    assert.equal(delivery.diagnostic, 'card_worker_timeout')
    assert.equal(sent.length, 1); assert.equal(sent[0].buffer, null)
    await Promise.all(pools.map(pool => pool.close()))
    assert.ok(children.every(child => child.exitCode !== null || child.signalCode !== null))
    const report = { offline: true, published: false, fixturesOnly: true, node: process.version,
      defaultLimits: { concurrency: 1, maxQueue: 4, queueMs: 2000, prepareMs: 5500, wallMs: 8000, cpuSeconds: 8,
        dataBytes: 402653184, oldSpaceMiB: 96, monitoredRssBytes: 268435456 },
      nativeImage: inspectCardImage(buffer), timings, responsiveTicks,
      timeoutRecovered: true, crashRecovered: true, nativeMemoryStopped: true, afterFailureSucceeded: true,
      textFallbackMessages: sent.length, fallbackDiagnostic: delivery.diagnostic,
      allChildrenReaped: true, poolsClosed: pools.every(pool => pool.state().closed && pool.state().active === 0),
    }
    await fs.mkdir(path.dirname(output), { recursive: true })
    await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n')
    console.log(JSON.stringify(report))
  } finally { clearInterval(timer); await Promise.all(pools.map(pool => pool.close())) }
}
main().catch(error => { console.error(error.code || 'isolation_verification_failed'); process.exitCode = 1 })
